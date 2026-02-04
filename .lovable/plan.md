
# Fix Build Errors for KoalaSignLayout Integration

## Overview
The KoalaSignLayout component was added as a new template option, but there are build errors that need to be fixed before it can be used. The layout currently does NOT show on the main website - it's designed to be a template for brand landing pages.

---

## Build Errors to Fix

### Error 1: Invalid CSS Property `ringColor`
**File:** `src/components/landing/layouts/KoalaSignLayout.tsx` (line 260)
**Problem:** `ringColor` is not a valid CSS property name
**Fix:** Remove `ringColor` from inline styles and use proper CSS ring styling via Tailwind classes

### Error 2: Database ENUM Type Mismatch  
**File:** `src/hooks/useTemplates.ts` (line 34)
**Problem:** The database `landing_base_layout` ENUM only has 8 values, but the TypeScript type includes `koala_sign` and `redline_delivery`
**Fix:** Add a database migration to extend the ENUM with the new layout types

---

## Implementation Steps

### Step 1: Fix CSS Property Error in KoalaSignLayout.tsx
Replace the inline `ringColor` style with proper styling:

```typescript
// Before (line 260):
style={plan.popular ? { borderColor: `${theme.primaryColor}30`, ringColor: `${theme.primaryColor}10` } : {}}

// After:
style={plan.popular ? { borderColor: `${theme.primaryColor}30`, boxShadow: `0 0 0 4px ${theme.primaryColor}10` } : {}}
```

### Step 2: Database Migration to Add New Layout Types
Add the new layout values to the Postgres ENUM:

```sql
-- Add new layout types to the landing_base_layout enum
ALTER TYPE landing_base_layout ADD VALUE IF NOT EXISTS 'koala_sign';
ALTER TYPE landing_base_layout ADD VALUE IF NOT EXISTS 'redline_delivery';
```

---

## Technical Notes

- The `src/integrations/supabase/types.ts` file is auto-generated and will update automatically after the database migration
- The `src/types/templates.ts` file already includes the new layout types, so no changes needed there
- The `LayoutRenderer.tsx` already has the component mappings for both new layouts

---

## What Happens After These Fixes

Once fixed, you'll be able to:
1. Create templates in the Admin Portal using the `koala_sign` layout
2. Apply these templates to brands
3. Brands with custom domains will serve the KoalaSign landing page

The main homepage (`/`) will continue showing the standard Autodox landing page.
