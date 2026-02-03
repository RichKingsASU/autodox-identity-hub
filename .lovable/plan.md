

# Plan: Add Template Assignment to Brands Tab

## Overview
Add the ability to assign landing page templates to brands directly from the Brands admin tab. This includes displaying the current template, and allowing admins to change or assign templates.

## Part 1: Fix Build Errors (Edge Functions)

Several edge functions have TypeScript errors due to untyped error handling and missing type definitions.

### Files to Fix:
- `supabase/functions/add-domain-to-netlify/index.ts`
- `supabase/functions/check-ssl-status/index.ts`
- `supabase/functions/domain-resolver/index.ts`
- `supabase/functions/resend-domain-status/index.ts`
- `supabase/functions/send-brand-event-email/index.ts`
- `supabase/functions/serve-brand-landing/index.ts`
- `supabase/functions/verify-domain-dns/index.ts`

### Fix Pattern:
Replace `error.message` with proper type-safe access:
```typescript
// Before
error: error.message || 'An unexpected error occurred'

// After  
error: error instanceof Error ? error.message : 'An unexpected error occurred'
```

For `serve-brand-landing/index.ts`, add type for RPC result:
```typescript
interface BrandRouteResult {
  brand_id: string;
  // other fields as needed
}
```

---

## Part 2: Add Template Column to Brand Table

### File: `src/components/admin/BrandPortfolioTable.tsx`

Add a new "Template" column showing the currently assigned template name (or "None").

### Changes:
1. Accept `templates` prop (list of templates for lookup)
2. Add "Template" column header after "Domain Status"
3. Display template name or "None" badge for each brand
4. Show template version badge (e.g., "v3")

---

## Part 3: Add Template Tab to Edit Brand Modal

### File: `src/components/admin/EditBrandModal.tsx`

Add a third tab for template management alongside "General" and "Domain".

### Changes:
1. Add `LayoutTemplate` icon import
2. Add new "Template" tab trigger
3. Create template selection content:
   - Show current template info (name, version, applied date)
   - Dropdown to select new template (filtered to published only)
   - "Apply Template" button
   - "Revert to Previous" button (if previous exists)
4. Wire up `useTemplates` hook for `applyTemplateToBrand` and `revertBrandTemplate`
5. Add `useAuth` hook to get current admin user ID

---

## Part 4: Update Brand Type & Hook

### File: `src/hooks/useBrands.ts`

Extend the Brand interface and fetch to include template relationship:

```typescript
// Add to Brand interface
active_template_id: string | null;
applied_template_version: number | null;
template_applied_at: string | null;
// Add template name via join
active_template_name?: string;
```

Update `fetchBrands` query to join with `landing_templates`:
```typescript
.select(`
  *,
  landing_templates:active_template_id (
    id,
    name,
    version
  )
`)
```

---

## Implementation Summary

| Component | Change |
|-----------|--------|
| 7 Edge Functions | Fix TypeScript error handling |
| BrandPortfolioTable | Add Template column |
| EditBrandModal | Add Template tab with assign/revert |
| useBrands | Include template join in query |

## User Flow

1. Admin opens Brands tab
2. Sees "Template" column showing assigned template or "None"
3. Clicks "Edit" on a brand
4. Navigates to "Template" tab
5. Selects a published template from dropdown
6. Clicks "Apply Template"
7. Template is immediately applied to brand
8. Can revert if needed using "Revert" button

