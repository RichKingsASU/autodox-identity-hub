
# Comprehensive Domain Management Hardening

## Overview
This plan addresses all identified edge cases and issues in the domain management workflow to make it production-ready.

---

## 1. Netlify Domain Cleanup on Removal

**Problem**: When removing a domain from a brand, only the database is updated. The domain remains registered in Netlify, causing orphaned resources.

**Solution**: Create a new Edge Function `remove-domain-from-netlify` and call it from `useBrandDomain.removeDomain()`.

**New File**: `supabase/functions/remove-domain-from-netlify/index.ts`
```text
Flow:
┌─────────────────────────┐
│ User clicks "Remove"    │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Call remove-domain-     │
│ from-netlify function   │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Delete from Netlify API │
│ DELETE /sites/{id}/     │
│ domains/{domain}        │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Clear database fields   │
└─────────────────────────┘
```

**Modified**: `src/hooks/useBrandDomain.ts` - Update `removeDomain()` to call the new edge function

---

## 2. Domain Uniqueness Validation

**Problem**: No database constraint prevents the same domain from being assigned to multiple brands.

**Solution**: 
- Add SQL migration for `UNIQUE` index on `brands.domain` (partial, where domain is not null)
- Add client-side validation in `setDomain()` to check for existing domains

**Database Migration**:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS brands_domain_unique 
ON brands(domain) 
WHERE domain IS NOT NULL;
```

**Modified**: `src/hooks/useBrandDomain.ts` - Add duplicate check before saving

---

## 3. Fix Apex Domain Detection for ccTLDs

**Problem**: Current logic `domain.split(".").length === 2` incorrectly identifies multi-level TLDs (e.g., `example.co.uk`) as subdomains.

**Solution**: Use a known public suffix list or heuristic that handles common ccTLDs.

**Modified**: `src/components/admin/BrandDomainTab.tsx`

Current (broken):
```typescript
const isApexDomain = (domain: string) => {
  const parts = domain.split(".");
  return parts.length === 2;  // WRONG: fails for .co.uk
};
```

Fixed:
```typescript
// List of known multi-level TLDs
const MULTI_LEVEL_TLDS = [
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk',
  'com.au', 'net.au', 'org.au',
  'co.nz', 'org.nz',
  'co.jp', 'ne.jp', 'or.jp',
  'com.br', 'org.br',
  // ... etc
];

const isApexDomain = (domain: string) => {
  const lower = domain.toLowerCase();
  for (const tld of MULTI_LEVEL_TLDS) {
    if (lower.endsWith(`.${tld}`)) {
      // e.g., "example.co.uk" → ["example", "co.uk"]
      const withoutTld = lower.slice(0, -(tld.length + 1));
      return !withoutTld.includes('.');
    }
  }
  // Standard TLD check
  const parts = domain.split('.');
  return parts.length === 2;
};
```

---

## 4. Reserved Domain Validation

**Problem**: Users could potentially configure platform-owned domains (e.g., `lovable.app`, `autodox.netlify.app`).

**Solution**: Block reserved domains in the `setDomain()` function.

**Modified**: `src/hooks/useBrandDomain.ts`

```typescript
const RESERVED_DOMAINS = [
  'lovable.app',
  'lovable.dev', 
  'netlify.app',
  'netlify.com',
  'supabase.co',
  'autodox.netlify.app',
  'agents-institute.com',
  // Add platform-specific domains
];

// In setDomain():
const isReserved = RESERVED_DOMAINS.some(
  reserved => domainName === reserved || domainName.endsWith(`.${reserved}`)
);
if (isReserved) {
  toast.error('This domain is reserved and cannot be used');
  return false;
}
```

---

## 5. DNS Verification Rate Limiting

**Problem**: Users can spam the "Verify DNS" button, causing excessive DNS lookups.

**Solution**: Add a cooldown period (30 seconds) between verification attempts.

**Modified Files**:
- `src/hooks/useBrandDomain.ts` - Add timestamp tracking
- `src/components/admin/BrandDomainTab.tsx` - Show cooldown countdown

**Implementation**:
```typescript
// Track last verification attempt in component state
const [lastVerifyAttempt, setLastVerifyAttempt] = useState<Date | null>(null);
const VERIFY_COOLDOWN_MS = 30000; // 30 seconds

const canVerify = !lastVerifyAttempt || 
  (Date.now() - lastVerifyAttempt.getTime()) > VERIFY_COOLDOWN_MS;
```

---

## 6. SSL Provisioning Timeout Handling

**Problem**: SSL provisioning can take time, but there's no timeout or progress indicator.

**Solution**: Add status message and auto-retry mechanism with maximum attempt tracking.

**Modified**: `src/components/admin/BrandDomainTab.tsx`

```typescript
// Show informative message during SSL provisioning
{domainState.domain_status === "provisioning_ssl" && (
  <Alert>
    <Loader2 className="h-4 w-4 animate-spin" />
    <AlertDescription>
      SSL certificate is being provisioned. This typically takes 2-5 minutes.
      <br />
      <span className="text-xs text-muted-foreground">
        You can close this page - SSL will continue provisioning in the background.
      </span>
    </AlertDescription>
  </Alert>
)}
```

---

## Files Summary

| Action | File |
|--------|------|
| **Create** | `supabase/functions/remove-domain-from-netlify/index.ts` |
| **Modify** | `supabase/config.toml` (add function config) |
| **Modify** | `src/hooks/useBrandDomain.ts` (Netlify cleanup, reserved domains, duplicate check) |
| **Modify** | `src/components/admin/BrandDomainTab.tsx` (apex detection fix, rate limiting UI, SSL messaging) |
| **Migration** | Add UNIQUE index on `brands.domain` |

---

## Implementation Order

1. Database migration (UNIQUE constraint)
2. Create `remove-domain-from-netlify` Edge Function
3. Update `useBrandDomain.ts` with all validations
4. Update `BrandDomainTab.tsx` with UI improvements
5. Update `config.toml` for new function
6. Test full workflow end-to-end

---

## Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| UNIQUE constraint | Low | Partial index only affects non-null domains |
| Netlify removal | Medium | Graceful error handling if domain doesn't exist |
| Apex detection | Low | Conservative list of known ccTLDs |
| Rate limiting | Low | Client-side only, doesn't block legitimate use |
