
# Automated DNS Configuration Retrieval Flow

## Overview

Create an automated flow that fetches DNS requirements from Netlify's API instead of using hardcoded values. This will dynamically retrieve the correct A record IPs, CNAME targets, and verification requirements based on the actual Netlify site configuration.

## Current State

The system currently uses hardcoded values in `BrandDomainTab.tsx`:
- A Record: `75.2.60.5` (hardcoded)
- CNAME: `autodox.netlify.app` (hardcoded)
- TXT verification prefix: `_autodox-verify` (hardcoded)

## Proposed Architecture

```text
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│ BrandDomainTab  │────▶│ get-dns-requirements │────▶│ Netlify API  │
│   (Frontend)    │     │   (Edge Function)    │     │              │
└─────────────────┘     └─────────────────────┘     └──────────────┘
                                  │
                                  ▼
                        ┌─────────────────────┐
                        │    brands table     │
                        │ (cache DNS config)  │
                        └─────────────────────┘
```

## Implementation Steps

### Step 1: Create `get-dns-requirements` Edge Function

Create a new edge function that queries Netlify API to retrieve:
- The Netlify site's default domain (`{site_name}.netlify.app`)
- Load balancer IPs for A records
- Domain-specific verification requirements

**API Calls:**
1. `GET /sites/{site_id}` - Get site info including default subdomain
2. `GET /sites/{site_id}/domains/{domain}` - Get domain-specific DNS requirements (if domain already added)

**Response Structure:**
```json
{
  "site_subdomain": "identitybrandhub.netlify.app",
  "load_balancer_ip": "75.2.60.5",
  "dns_records": {
    "apex": {
      "type": "A",
      "name": "@",
      "value": "75.2.60.5"
    },
    "subdomain": {
      "type": "CNAME",
      "name": "{subdomain}",
      "value": "identitybrandhub.netlify.app"
    },
    "verification": {
      "type": "TXT",
      "name": "_autodox-verify",
      "value": "{token}"
    }
  }
}
```

### Step 2: Enhance Netlify MCP Server

Add a new tool `get_dns_requirements` to the MCP server at `supabase/functions/netlify-mcp/index.ts`:

```typescript
mcp.tool("get_dns_requirements", {
  description: "Get required DNS records for adding a custom domain",
  inputSchema: {
    type: "object",
    properties: {
      domain: { type: "string", description: "The domain to get requirements for" },
      verification_token: { type: "string", description: "Optional verification token" }
    },
    required: ["domain"]
  },
  handler: async (args) => {
    // Fetch site info to get actual subdomain
    const site = await netlifyFetch(`/sites/${NETLIFY_SITE_ID}`);
    const isApex = !args.domain.includes('.') || args.domain.split('.').length === 2;
    
    return {
      site_subdomain: site.ssl_url || `https://${site.name}.netlify.app`,
      records: {
        routing: isApex 
          ? { type: "A", name: "@", value: "75.2.60.5" }
          : { type: "CNAME", name: args.domain.split('.')[0], value: `${site.name}.netlify.app` },
        verification: args.verification_token 
          ? { type: "TXT", name: "_autodox-verify", value: args.verification_token }
          : null
      }
    };
  }
});
```

### Step 3: Create Hook for DNS Requirements

Create `src/hooks/useDNSRequirements.ts`:

```typescript
export function useDNSRequirements(domain: string, verificationToken: string | null) {
  const [dnsConfig, setDnsConfig] = useState<DNSConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDNSRequirements = useCallback(async () => {
    if (!domain) return;
    
    const response = await supabase.functions.invoke('get-dns-requirements', {
      body: { domain, verification_token: verificationToken }
    });
    
    if (response.data) {
      setDnsConfig(response.data);
    }
  }, [domain, verificationToken]);

  return { dnsConfig, loading, fetchDNSRequirements };
}
```

### Step 4: Update BrandDomainTab Component

Modify `src/components/admin/BrandDomainTab.tsx` to:
1. Fetch DNS requirements dynamically when a domain is configured
2. Display the fetched values instead of hardcoded ones
3. Show loading state while fetching
4. Handle errors gracefully with fallback to hardcoded values

Key changes:
- Remove hardcoded `75.2.60.5` and `autodox.netlify.app`
- Call `get-dns-requirements` API when domain is set
- Cache results to avoid repeated API calls

### Step 5: Add Optional DNS Verification via Netlify

Enhance the verification flow to also check Netlify's domain status:
- If domain is added to Netlify, check `verification_state` from API
- This provides a secondary verification method alongside the TXT record check

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/get-dns-requirements/index.ts` | Create | New edge function to fetch DNS config from Netlify |
| `supabase/functions/netlify-mcp/index.ts` | Modify | Add `get_dns_requirements` tool |
| `src/hooks/useDNSRequirements.ts` | Create | React hook for fetching DNS requirements |
| `src/components/admin/BrandDomainTab.tsx` | Modify | Use dynamic DNS values instead of hardcoded |
| `supabase/config.toml` | Modify | Add config for new edge function |

## Technical Details

### Netlify API Endpoints Used

1. **GET /sites/{site_id}**
   - Returns: `name`, `url`, `ssl_url`, `custom_domain`
   - Used to get the actual Netlify subdomain

2. **GET /sites/{site_id}/domains/{domain}**
   - Returns: DNS requirements, verification state, SSL status
   - Used when domain is already added to Netlify

### Fallback Strategy

If Netlify API is unavailable, fall back to:
- A Record: `75.2.60.5` (Netlify's standard load balancer)
- CNAME: `{NETLIFY_SITE_ID}.netlify.app`

### Caching Considerations

- Cache site info for 1 hour (rarely changes)
- Cache domain-specific config for 5 minutes (may change during provisioning)
- Store cached values in component state, not database (to keep it simple)

## Testing Plan

1. Test edge function returns correct values
2. Test MCP tool responds with proper DNS config
3. Test UI displays dynamic values
4. Test fallback when API is unavailable
5. Test with both apex domains and subdomains
6. Verify multi-level TLD detection still works (e.g., example.co.uk)

## Security Notes

- Edge function requires admin authentication
- No sensitive data exposed (DNS values are public)
- Rate limiting via existing cooldown mechanism
