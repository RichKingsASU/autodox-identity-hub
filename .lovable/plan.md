

# Add Demo Admin Account for Testing

## Current Situation

Your development environment has `DEV_BYPASS = true` enabled in `useAdminAuth.ts`, which automatically authenticates you as a super_admin. This is why you can currently access `/admin/templates`.

**Existing Admin Accounts:**
- richard1king1@gmail.com (super_admin)
- richardking427@yahoo.com (admin)

---

## Option A: Use Existing Accounts (Recommended for Quick Testing)

Simply log in with one of the existing admin credentials through the normal auth flow.

---

## Option B: Create a Demo Admin Account

If you need a fresh demo account, here's the implementation:

### Step 1: Create User via Supabase Auth

The demo admin user needs to be created through Supabase Auth first. This can be done by:
1. Signing up through the normal UI flow, OR
2. Using Supabase Dashboard to create a user directly

**Demo Credentials:**
- Email: `demo-admin@autodox.com`
- Password: (user-defined during signup)

### Step 2: Assign Admin Role

After the user is created, insert a role record:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'demo-admin@autodox.com';
```

### Step 3: Create Profile (if not auto-created)

```sql
INSERT INTO profiles (user_id, first_name, last_name, email)
SELECT id, 'Demo', 'Admin', 'demo-admin@autodox.com'
FROM auth.users
WHERE email = 'demo-admin@autodox.com'
ON CONFLICT (user_id) DO NOTHING;
```

---

## Option C: Disable DEV_BYPASS for Production-Like Testing

To test the actual authentication flow, update `useAdminAuth.ts`:

```typescript
// Change this line:
const DEV_BYPASS = import.meta.env.DEV && true;

// To:
const DEV_BYPASS = import.meta.env.DEV && false;
```

Then log in with an existing admin account.

---

## Recommended Approach

For immediate testing of the Template Management System:

1. **Keep DEV_BYPASS enabled** - You already have full super_admin access
2. **Test all features**: Preview, Edit, Apply to Brand, Activity Log
3. **Later**: Disable DEV_BYPASS and test with real admin credentials before production

---

## Implementation Steps

| Step | Action | Method |
|------|--------|--------|
| 1 | Decide testing approach | Choose Option A, B, or C |
| 2a | If Option A | Log in with existing admin email |
| 2b | If Option B | Sign up new user + run SQL to assign role |
| 2c | If Option C | Update DEV_BYPASS flag to false |
| 3 | Navigate to /admin/templates | Test template management features |

---

## Security Note

The `DEV_BYPASS` flag is documented in project memory as a security finding that must be disabled before production deployment. This is intentional for development convenience but should never be deployed to production.

