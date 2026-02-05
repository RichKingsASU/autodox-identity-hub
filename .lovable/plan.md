

# Remove All Lovable Branding

## Overview
This plan removes all Lovable branding and references from your project, giving you a clean white-label codebase.

## Settings Action (Do This First)
Go to **Project Settings** and enable **"Hide 'Lovable' Badge"** - this removes the floating heart icon on your published site.

## Code Changes

### 1. Remove Development Tagger
**File:** `vite.config.ts`
- Remove the `lovable-tagger` import and plugin call
- This eliminates the development badge

### 2. Update Social Media Images
**File:** `index.html`
- Replace `https://lovable.dev/opengraph-image-p98pqg.png` with your own branding image
- Affects both Open Graph and Twitter card previews

### 3. Update Admin Panel Text
**File:** `src/pages/admin/AdminSettings.tsx`
- Change "Lovable Cloud" reference to "Database" or "Cloud Backend"

**File:** `src/hooks/useIntegrationStatus.ts`
- Update the integration detail from "Lovable Cloud" to your preferred label

### 4. Clean Up Reserved Domains
**File:** `src/hooks/useBrandDomain.ts`
- Remove `lovable.app` and `lovable.dev` from the reserved domains list (optional - these prevent accidental misconfiguration)

### 5. Fix Password Reset Fallback
**File:** `supabase/functions/request-password-reset/index.ts`
- Update the hardcoded preview URL to your production domain (e.g., `https://agents-institute.com`)

### 6. Update Documentation
**File:** `README.md`
- Rewrite to reflect your project identity instead of Lovable boilerplate

## Files to Modify
| File | Change |
|------|--------|
| `vite.config.ts` | Remove lovable-tagger plugin |
| `index.html` | Update OG/Twitter images |
| `src/pages/admin/AdminSettings.tsx` | Remove "Lovable Cloud" text |
| `src/hooks/useIntegrationStatus.ts` | Update integration label |
| `src/hooks/useBrandDomain.ts` | Remove reserved domains (optional) |
| `supabase/functions/request-password-reset/index.ts` | Update fallback URL |
| `README.md` | Rebrand documentation |

