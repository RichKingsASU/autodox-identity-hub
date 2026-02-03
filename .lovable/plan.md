# Domain Management Hardening - COMPLETED ✅

## Implementation Status

All 6 recommendations have been implemented:

### 1. ✅ Netlify Domain Cleanup on Removal
- Created `supabase/functions/remove-domain-from-netlify/index.ts`
- Calls Netlify API to delete domain before clearing database
- Graceful error handling if domain doesn't exist in Netlify

### 2. ✅ Domain Uniqueness Validation  
- Added `UNIQUE INDEX brands_domain_unique ON brands(domain) WHERE domain IS NOT NULL`
- Client-side duplicate check in `setDomain()` before saving
- Handles unique constraint violation errors gracefully

### 3. ✅ Fix Apex Domain Detection for ccTLDs
- Updated `isApexDomain()` in `BrandDomainTab.tsx`
- Added comprehensive `MULTI_LEVEL_TLDS` list (50+ entries)
- Correctly identifies apex domains for `.co.uk`, `.com.au`, etc.

### 4. ✅ Reserved Domain Validation
- Added `RESERVED_DOMAINS` list in `useBrandDomain.ts`
- Blocks platform-owned domains (lovable.app, netlify.app, etc.)
- Validation runs before database operations

### 5. ✅ DNS Verification Rate Limiting
- 30-second cooldown between verification attempts
- Added `canVerify()` and `getCooldownRemaining()` to hook
- UI shows countdown timer on Verify DNS button

### 6. ✅ SSL Provisioning Timeout Handling
- Added informative Alert during `provisioning_ssl` status
- Shows expected time (2-5 minutes)
- Informs user they can close the page

## Files Changed

| File | Changes |
|------|---------|
| `supabase/functions/remove-domain-from-netlify/index.ts` | NEW - Edge function for Netlify cleanup |
| `supabase/config.toml` | Added function config with `verify_jwt = false` |
| `src/hooks/useBrandDomain.ts` | Reserved domains, duplicate check, rate limiting, Netlify cleanup call |
| `src/components/admin/BrandDomainTab.tsx` | Fixed apex detection, cooldown UI, SSL messaging |
| Database | `brands_domain_unique` partial unique index |
