
# DNS Edge Functions Consistency Fix

## Problem Summary
Several edge functions reference a `domains` table and `domain_events` table that don't exist. The current architecture stores domain information directly in the `brands` table. This causes these functions to fail when invoked.

## Current Architecture
Domain data is stored in the `brands` table with these columns:
- `domain` (text)
- `domain_status` (enum)
- `domain_verification_token` (text)
- `domain_verified_at` (timestamp)
- `ssl_status` (text)
- `domain_error` (text)
- `cloudflare_hostname_id` (text - stores Netlify domain ID)

## Functions Requiring Fixes

### 1. `check-ssl-status/index.ts` (BROKEN)
**Issue:** References non-existent `domains` table and `domain_events` table
**Fix:** Rewrite to accept `brand_id` parameter and query `brands` table

### 2. `verify-domain-dns/index.ts` (BROKEN)
**Issue:** References non-existent `domains` table and `domain_events` table
**Decision:** DELETE this function - it's redundant with `verify-domain/index.ts` which already works correctly

### 3. `domain-resolver/index.ts` (BROKEN)
**Issue:** Calls non-existent RPC function `get_brand_by_domain`
**Fix:** Query `brands` table directly instead of using RPC

### 4. `manual_domain_tests.md` (OUTDATED)
**Issue:** References old multi-domain architecture
**Fix:** Update to match single-domain-per-brand architecture

## Working Functions (No Changes Needed)
- `verify-domain/index.ts` - Correctly uses `brands` table
- `check-domain-status/index.ts` - Correctly uses `brands` table
- `remove-domain-from-netlify/index.ts` - Correctly uses `brands` table
- `provision-ssl/index.ts` - Correctly uses `brands` table
- `add-domain-to-netlify/index.ts` - Correctly uses `brands` table

---

## Implementation Plan

### Step 1: Fix `check-ssl-status/index.ts`
Update to accept `brand_id` parameter and query `brands` table:
```typescript
// Change from: const { domain_id } = await req.json()
// To: const { brand_id } = await req.json()

// Change from: .from('domains').select('*').eq('id', domain_id)
// To: .from('brands').select('domain, domain_status, ssl_status, cloudflare_hostname_id').eq('id', brand_id)
```

### Step 2: Delete `verify-domain-dns/index.ts`
This function is redundant - `verify-domain/index.ts` already handles DNS verification correctly using Cloudflare's DNS-over-HTTPS API.

### Step 3: Fix `domain-resolver/index.ts`
Replace RPC call with direct table query:
```typescript
// Change from: await supabase.rpc('get_brand_by_domain', { hostname })
// To: await supabase.from('brands').select(...).eq('domain', hostname).eq('domain_status', 'active')
```

### Step 4: Update test documentation
Rewrite `manual_domain_tests.md` to:
- Use `brands` table instead of `domains` table
- Remove references to `domain_events` table
- Update API parameters from `domain_id` to `brand_id`

---

## Technical Details

### check-ssl-status/index.ts Changes
```text
- Accept: { brand_id: string } instead of { domain_id: string }
- Query: brands table instead of domains table
- Remove: domain_events logging (table doesn't exist)
- Update: field mappings (domain_status instead of status)
```

### domain-resolver/index.ts Changes
```text
- Remove: RPC call to get_brand_by_domain
- Add: Direct query to brands table with active domain filter
- Update: Response to include active_template_id lookup
- Simplify: Return brand data directly
```

### Files to Delete
```text
supabase/functions/verify-domain-dns/
```

---

## Testing After Implementation
1. Deploy updated edge functions
2. Test `check-ssl-status` with a brand_id
3. Test `domain-resolver` with a hostname
4. Verify `verify-domain` still works (no changes)
5. Run through updated manual test plan
