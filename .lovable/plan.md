

# Fix Super Admin Role Detection

## Problem

The `useAdminAuth` hook has a race condition that causes role detection to fail:

1. `getSession()` is called and sets `loading = false` when there's no session, OR sets `user` but doesn't fetch roles
2. Role fetching only happens in `onAuthStateChange` callback
3. The component may render before roles are loaded

## Current Flow (Broken)

```text
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ getSession()│────▶│ Set user    │────▶│ loading=    │──▶ Component renders
│             │     │             │     │ false       │    with empty roles
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────┐
                    │ onAuthStateChange fires LATER   │
                    │ and fetches roles (too late!)   │
                    └─────────────────────────────────┘
```

## Fixed Flow

```text
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ getSession()│────▶│ Set user    │────▶│ Fetch roles │────▶│ loading=    │
│             │     │             │     │             │     │ false       │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Implementation

### File: `src/hooks/useAdminAuth.ts`

**Changes:**

1. **Create a reusable `fetchRoles` function** that can be called from both `getSession()` and `onAuthStateChange`

2. **Remove unnecessary `setTimeout`** wrapper that causes timing issues

3. **Fetch roles immediately in `getSession().then()`** when a session exists, then set `loading = false` only after roles are fetched

4. **Add error handling** for role fetching failures

### Updated Code Logic

```typescript
// Helper function to fetch roles
const fetchUserRoles = async (userId: string) => {
  const { data: userRoles, error } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error fetching user roles:", error);
    return [];
  }
  
  return userRoles?.map((r) => r.role) ?? [];
};

// In getSession().then():
if (session?.user) {
  setUser(session.user);
  const roleList = await fetchUserRoles(session.user.id);
  setRoles(roleList);
  setIsAdmin(roleList.includes("admin") || roleList.includes("super_admin"));
  setIsSuperAdmin(roleList.includes("super_admin"));
}
setLoading(false);

// In onAuthStateChange:
// Use same fetchUserRoles function, no setTimeout
```

## Why This Fixes The Issue

| Before | After |
|--------|-------|
| Roles fetched only in `onAuthStateChange` | Roles fetched in both places |
| `loading = false` before roles loaded | `loading = false` only after roles fetched |
| `setTimeout` causes unpredictable timing | Direct async/await for predictable flow |
| No error handling for role fetch | Console logging for debugging |

## Testing

After implementation:
1. Sign out completely
2. Sign in as `richard1king1@gmail.com`
3. Navigate to `/admin`
4. Verify the admin dashboard loads (not "Access Denied")
5. Verify "Access Control" menu item appears (super_admin only)

