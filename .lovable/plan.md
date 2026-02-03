
# Plan: Fix Domain Management for Brands

## Problem
The Domain tab in the Edit Brand modal doesn't work because:
1. `useDomains` hook is a non-functional stub (shows "Use brand settings" toast)
2. `DomainManagementCard` depends on this broken hook
3. Some edge functions expect a `domains` table that doesn't exist

## Solution
Implement working domain management using the existing `brands` table fields.

## Changes

### Part 1: Create Domain Management Hook for Brands

**New File: `src/hooks/useBrandDomain.ts`**

A focused hook that manages domains through the brands table:

```typescript
export const useBrandDomain = (brandId: string) => {
  // State for domain, status, verification token
  
  // setDomain() - Updates brands.domain and generates verification token
  // verifyDomain() - Calls verify-domain edge function
  // provisionSSL() - Calls add-domain-to-netlify edge function (updated)
  // checkStatus() - Calls check-domain-status edge function
  // removeDomain() - Clears domain fields from brand
}
```

### Part 2: Replace DomainManagementCard Content

**File: `src/components/admin/EditBrandModal.tsx`**

Replace `DomainManagementCard` with inline domain management in the Domain tab:

- **Current Domain Display**: Show domain, status badge, SSL status
- **Add/Change Domain**: Input field with "Save Domain" button
- **DNS Instructions**: Display required records (A record for apex, CNAME for subdomain)
- **Verification Token**: Show TXT record instructions with copy button
- **Action Buttons**: "Verify DNS", "Check SSL Status", "Remove Domain"

### Part 3: Update Edge Function

**File: `supabase/functions/add-domain-to-netlify/index.ts`**

Change to work with `brands` table instead of non-existent `domains` table:

```typescript
// Before: queries 'domains' table
const { data: domain } = await supabase.from('domains').select('*')

// After: queries 'brands' table
const { data: brand } = await supabase.from('brands').select('domain, domain_status, ...')
```

### Part 4: Remove Unused Components

Delete components that won't be needed:
- `src/components/admin/DomainManagementCard.tsx` (replaced with inline UI)
- `src/components/admin/DomainWizard.tsx` (replaced with inline UI)
- `src/components/admin/DNSDetailsDialog.tsx` (merged into Domain tab)
- `src/hooks/useDomains.ts` (replaced with useBrandDomain)

## Domain Configuration Flow

```text
1. Admin enters domain in Edit Brand > Domain tab
2. System generates verification token and saves to brand
3. Admin adds DNS records at their registrar:
   - TXT record: _autodox-verify.domain.com → token
   - A record: domain.com → 75.2.60.5
4. Admin clicks "Verify DNS" → calls verify-domain function
5. On success, system calls add-domain-to-netlify function
6. SSL auto-provisions via Netlify
7. Domain becomes active
```

## UI Mockup (Domain Tab)

```text
┌─────────────────────────────────────────────┐
│ Current Domain                              │
│ ┌─────────────────────────────────────────┐ │
│ │ mybrand.com        [Active] [SSL: ✓]   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Domain Name                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ mybrand.com                             │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ DNS Configuration Required:                 │
│ ┌─────────────────────────────────────────┐ │
│ │ Type: TXT                               │ │
│ │ Name: _autodox-verify                   │ │
│ │ Value: adx_xxxxx...          [Copy]     │ │
│ ├─────────────────────────────────────────┤ │
│ │ Type: A                                 │ │
│ │ Name: @                                 │ │
│ │ Value: 75.2.60.5             [Copy]     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Verify DNS]  [Check SSL]  [Remove Domain]  │
└─────────────────────────────────────────────┘
```

## Files Summary

| Action | File |
|--------|------|
| Create | `src/hooks/useBrandDomain.ts` |
| Update | `src/components/admin/EditBrandModal.tsx` |
| Update | `supabase/functions/add-domain-to-netlify/index.ts` |
| Delete | `src/components/admin/DomainManagementCard.tsx` |
| Delete | `src/components/admin/DomainWizard.tsx` |
| Delete | `src/components/admin/DNSDetailsDialog.tsx` |
| Delete | `src/hooks/useDomains.ts` |
