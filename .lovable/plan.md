

# Fix: Templates Not Visible Due to RLS + Mock Auth Mismatch

## Problem Identified

The `DEV_BYPASS` in `useAdminAuth.ts` creates a fake user object on the client side, but **it doesn't establish a real Supabase auth session**. When `useTemplates` queries the database:

```
RLS Policy: is_admin(auth.uid())
           ↓
auth.uid() = NULL (no real session)
           ↓
is_admin(NULL) = false
           ↓
Query returns 0 rows
```

The 60 templates exist in the database but are blocked by RLS.

---

## Solution Options

### Option A: Add Service Role Key for Dev Bypass (Not Recommended)
Using service role bypasses RLS but exposes the key client-side - **security risk**.

### Option B: Disable RLS in Development (Not Recommended)
Would require database changes and risks shipping insecure code.

### Option C: Sign In with Real Admin Account (Recommended)
Use existing admin credentials to establish a real Supabase session.

### Option D: Add Public Read Policy for Templates (Recommended)
Templates are configuration data, not sensitive. A read-only public policy is safe.

---

## Recommended Fix: Option D

Add a public SELECT policy for `landing_templates` since template metadata is not sensitive (they're just landing page configurations). This also supports future public portal rendering.

### Database Change

```sql
-- Allow anyone to read templates (they're public configuration)
CREATE POLICY "Anyone can view published templates"
ON public.landing_templates
FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Keep admin-only policy for all templates (including drafts)
-- The existing "Admins can view all templates" policy handles this
```

This allows:
- **Anonymous/unauthenticated users**: Can see `published` templates only
- **Admins**: Can see ALL templates (draft, published, disabled) via existing policy

---

## Implementation Steps

| Step | Action |
|------|--------|
| 1 | Create migration to add public SELECT policy for published templates |
| 2 | Test that templates appear in admin UI with DEV_BYPASS active |
| 3 | Verify drafts/disabled templates only visible to real admin sessions |

---

## Alternative Quick Fix

If you prefer to test with full admin access immediately:

1. **Disable DEV_BYPASS** (set to `false`)
2. **Log in** with `richard1king1@gmail.com` (super_admin)
3. Navigate to `/admin/templates`

This establishes a real Supabase session where `auth.uid()` returns the actual user ID, and RLS policies work correctly.

---

## Technical Details

**Current RLS on `landing_templates`:**
- `Admins can view all templates` → `is_admin(auth.uid())`
- `Admins can create templates` → `is_admin(auth.uid())`
- `Admins can update templates` → `is_admin(auth.uid())`

**Proposed Addition:**
- `Anyone can view published templates` → `status = 'published'`

This maintains security for draft/disabled templates while allowing the dev bypass to work for published ones.

