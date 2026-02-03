
# Domain Deployment Walkthrough

## Overview
Step-by-step guide to add brands and deploy domains for **never-forget-occasions.com** and **retropawnshop.com** using the Admin Panel's domain management system.

## Current State

| Domain | Status | Notes |
|--------|--------|-------|
| retropawnshop.com | Exists - Pending DNS | Already has brand, needs DNS verification |
| never-forget-occasions.com | Not Created | Needs new brand creation |

## Domain Lifecycle Flow

```text
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌────────────────┐    ┌─────────────┐
│  Create     │───▶│  Set Domain │───▶│  Add DNS    │───▶│  Verify DNS    │───▶│  SSL Active │
│  Brand      │    │  + Token    │    │  Records    │    │  + Provision   │    │  ✓ Live     │
└─────────────┘    └─────────────┘    └─────────────┘    └────────────────┘    └─────────────┘
      UI               UI                External            Edge Functions        Automatic
```

## Part 1: never-forget-occasions.com (New Brand)

### Step 1: Create Brand
1. Navigate to `/admin/brands`
2. Click **"New Brand"** button
3. Fill in brand details:
   - **Brand Name**: Never Forget Occasions
   - **URL Slug**: never-forget-occasions (auto-generated)
   - Click **Continue**
4. On step 2:
   - **Custom Domain**: never-forget-occasions.com
   - **Monthly SMS Limit**: 10000 (default)
   - Click **Create Brand**

### Step 2: Get DNS Requirements
After creation, the system will:
- Generate a verification token (format: `adx_xxxxxxxxxxxxxxxxxxxxxxxxxx`)
- Fetch DNS requirements from Netlify API
- Display required DNS records

**Required DNS Records for never-forget-occasions.com (Apex Domain):**

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| TXT | _autodox-verify | `adx_[generated_token]` | Domain ownership verification |
| A | @ | 75.2.60.5 | Route traffic to Netlify |

### Step 3: Configure DNS at Registrar
At your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):
1. Add TXT record for verification
2. Add A record pointing to Netlify load balancer
3. Wait 5-10 minutes for DNS propagation

### Step 4: Verify and Provision SSL
1. Click **"Verify DNS"** button in the Domain tab
2. If successful, SSL provisioning starts automatically
3. Domain status progresses: `pending` → `verifying` → `verified` → `provisioning_ssl` → `active`

## Part 2: retropawnshop.com (Existing Brand - Pending)

### Current State
- **Brand ID**: d2544f02-2fef-4cf8-af2a-f4e1d9c5a15e
- **Status**: pending
- **Verification Token**: `adx_jfmxparnnpv2f7k45e7zwonktx8qil0j`

### Step 1: Get Current DNS Requirements
Navigate to `/admin/brands` → Click retropawnshop → Domain tab

**Required DNS Records for retropawnshop.com (Apex Domain):**

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| TXT | _autodox-verify | `adx_jfmxparnnpv2f7k45e7zwonktx8qil0j` | Domain ownership verification |
| A | @ | 75.2.60.5 | Route traffic to Netlify |

### Step 2: Add DNS Records at Registrar
1. Log into retropawnshop.com's DNS provider
2. Add TXT record: `_autodox-verify.retropawnshop.com` → `adx_jfmxparnnpv2f7k45e7zwonktx8qil0j`
3. Add A record: `@` (or `retropawnshop.com`) → `75.2.60.5`

### Step 3: Verify DNS
1. Wait for DNS propagation (5-10 minutes typically)
2. Click **"Verify DNS"** button
3. System calls `verify-domain` edge function:
   - Queries Cloudflare DNS-over-HTTPS for TXT record
   - Validates token matches
   - Updates status to `verified`

### Step 4: SSL Provisioning
Upon verification success:
1. System automatically triggers `add-domain-to-netlify` edge function
2. Netlify adds domain to site and provisions SSL certificate
3. Status updates to `provisioning_ssl` → `active` (typically 2-5 minutes)

## Edge Functions Involved

| Function | Purpose | Trigger |
|----------|---------|---------|
| `get-dns-requirements` | Fetch dynamic DNS config from Netlify API | On domain tab load |
| `verify-domain` | Check TXT record via Cloudflare DNS-over-HTTPS | "Verify DNS" button |
| `add-domain-to-netlify` | Add domain to Netlify site, provision SSL | After verification |
| `check-domain-status` | Poll SSL status from Netlify | "Check SSL Status" button |
| `remove-domain-from-netlify` | Remove domain from Netlify and clear DB | "Remove Domain" button |

## Testing the Full Flow

### Via Admin UI
1. Create never-forget-occasions brand at `/admin/brands`
2. Navigate to brand → Domain tab
3. Observe DNS Sync Indicator shows "Live API" source
4. Follow DNS setup instructions
5. Click Verify DNS after adding records
6. Monitor status progression to Active

### Via Database (Verification)
```sql
SELECT id, name, domain, domain_status, ssl_status, domain_verification_token 
FROM brands 
WHERE domain IN ('never-forget-occasions.com', 'retropawnshop.com');
```

## Status Meanings

| Status | Description | Next Action |
|--------|-------------|-------------|
| `pending` | Domain configured, awaiting DNS records | Add DNS records, then Verify |
| `verifying` | DNS check in progress | Wait for result |
| `verified` | TXT record validated | SSL provisioning auto-starts |
| `provisioning_ssl` | SSL certificate being issued | Wait 2-5 minutes |
| `active` | Domain fully operational | Visit site |
| `failed` | Error occurred | Check error message, retry |

## Integration Status Monitoring

The Admin Panel shows:
- **Compact Status Indicator** in sidebar header (3 dots for Netlify/Resend/DB)
- **DNS Sync Indicator** in Domain tab showing API source
- **Integration Status Panel** on Overview and Settings pages

## Troubleshooting

### DNS Not Verifying
- Verify TXT record is exactly `_autodox-verify` (not `_autodox-verify.yourdomain.com` at some registrars)
- Use [DNS Checker](https://dnschecker.org) to verify propagation
- Wait 30 seconds between verification attempts (rate limited)

### SSL Not Provisioning
- Ensure A record points to `75.2.60.5`
- Check Netlify credentials are configured (`NETLIFY_ACCESS_TOKEN`, `NETLIFY_SITE_ID`)
- View error in Domain tab if failed

### Fallback Mode
If DNS Sync Indicator shows "Cached", the Netlify API is temporarily unavailable but system continues with fallback values.
