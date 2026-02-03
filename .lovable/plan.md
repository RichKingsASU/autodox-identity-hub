

# Plan: Fix Brand Deletion Permission

## Problem
The `brands` table DELETE policy only allows `super_admin` role to delete brands. Regular `admin` users cannot delete brands, and the current error handling doesn't clearly communicate this permission issue.

## Solution Options

### Option A: Allow Admins to Delete Brands (Recommended)
Update the RLS policy to allow both `admin` and `super_admin` roles to delete brands.

**Database Migration:**
```sql
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Super admins can delete brands" ON brands;

-- Create new policy allowing all admins to delete
CREATE POLICY "Admins can delete brands"
ON brands FOR DELETE
USING (is_admin(auth.uid()));
```

### Option B: Keep Super Admin Only (More Secure)
Keep the current policy but improve error messaging to inform users they need super_admin privileges.

**Code Change in `useBrands.ts`:**
```typescript
const deleteBrand = async (brandId: string): Promise<boolean> => {
  const { error: deleteError } = await supabase
    .from("brands")
    .delete()
    .eq("id", brandId);

  if (deleteError) {
    if (deleteError.code === '42501') {
      toast.error("Permission denied: Only super admins can delete brands");
    } else {
      toast.error(`Failed to delete brand: ${deleteError.message}`);
    }
    return false;
  }
  // ...
};
```

## Recommendation

**Option A** is recommended because:
- Admins already have full control over brands (create, update, status changes)
- Deleting brands is a natural extension of admin capabilities
- The current split permission (admin for everything except delete) is inconsistent

## Technical Details

| Change | Description |
|--------|-------------|
| Migration | Update RLS DELETE policy to use `is_admin()` function |
| No code changes | The existing `deleteBrand` function will work once RLS allows it |

## Files Summary

| Action | File |
|--------|------|
| Migration | Update brands DELETE policy |

