
# Bug Fix: Domain Whitespace Trimming

## Problem Discovered
During uniqueness testing, a domain with a leading space (` retropawnshop.com`) bypassed the uniqueness validation because it's technically different from `retropawnshop.com`. This is a validation gap.

## Data Issues Found
| Brand | Issue |
|-------|-------|
| retropawnshop | Slug is `http://retropawnshop.com/` instead of `retropawnshop` |
| Test Brand | Domain has leading space: ` retropawnshop.com` |

## Implementation Plan

### 1. Fix Domain Validation (Code Change)
**File:** `src/hooks/useBrandDomain.ts`

Add `.trim()` to domain input before all validation checks:
- In `setDomain()` function, trim the domain value immediately
- This ensures whitespace can't bypass uniqueness or reserved domain checks

### 2. Fix Existing Data (Database)
Clean up the test data:
```sql
-- Fix retropawnshop's malformed slug
UPDATE brands SET slug = 'retropawnshop' WHERE id = 'd2544f02-2fef-4cf8-af2a-f4e1d9c5a15e';

-- Trim Test Brand's domain (or clear it for re-testing)
UPDATE brands SET domain = NULL WHERE id = '422db4c0-af20-467d-ad67-20d2032e810d';
```

### 3. Add Trim to Create/Edit Modals
**Files:** `src/components/admin/CreateBrandModal.tsx`, `src/components/admin/EditBrandModal.tsx`

Ensure domain is trimmed before submission to catch issues at the UI level.

## After Fix: Re-test Uniqueness
1. Clear Test Brand's domain
2. Try setting it to `retropawnshop.com` (no spaces)
3. Should now correctly show "Domain already in use" error

## Technical Details
The fix involves adding `.trim()` calls in 3 locations:
- `useBrandDomain.ts` - `setDomain()` function
- `CreateBrandModal.tsx` - form submission handler  
- `EditBrandModal.tsx` - form submission handler
