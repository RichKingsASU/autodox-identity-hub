
# Build Missing Admin Pages: Settings & Access Control

## Overview

This plan creates two new admin pages to complete the admin console:
1. **Admin Settings** (`/admin/settings`) - System configuration for all admins
2. **Access Control** (`/admin/access`) - Super admin-only role management

---

## Page 1: Admin Settings

### Purpose
Centralized system configuration for email templates, rate limits, feature flags, and platform defaults.

### UI Structure
Uses tabbed interface (matching existing `Settings.tsx` pattern) with GlassCard sections:

| Tab | Contents |
|-----|----------|
| **General** | Platform name, support email, default brand settings |
| **Email Templates** | Configure sender name, reply-to address, email signature |
| **Rate Limits** | Default API rate limits, SMS monthly caps |
| **Feature Flags** | Toggle maintenance mode, beta features, debug logging |

### Components to Create

**File: `src/pages/admin/AdminSettings.tsx`**
- Header with Settings icon and description
- Tabs component with 4 tabs
- GlassCard sections for each configuration group
- Form inputs with save functionality
- Toast notifications on save

### Data Storage
For now, settings will be stored in localStorage as a stopgap (no new database table needed). A future iteration could add a `system_settings` table.

---

## Page 2: Access Control (Super Admin Only)

### Purpose
Manage admin roles, view role assignments, and audit privilege changes. Only visible to super_admins per existing sidebar logic.

### UI Structure

| Section | Contents |
|---------|----------|
| **Role Overview** | Cards showing count of super_admins, admins, and regular users |
| **Role Assignments Table** | List of all users with admin/super_admin roles |
| **Audit Log** | Recent role changes (placeholder for future audit table) |

### Components to Create

**File: `src/pages/admin/AdminAccess.tsx`**
- Header with Shield icon
- Stats cards for role distribution
- Data table of privileged users (admins + super_admins)
- Role upgrade/downgrade actions with confirmation dialogs
- Ability to grant super_admin role (super_admin exclusive)

**File: `src/hooks/useRoleManagement.ts`**
- Query for users with elevated roles
- Mutations for granting/revoking roles
- Leverages existing `user_roles` table

### Security Notes
- Page visibility already gated by `AdminSidebar` (only shows for `isSuperAdmin`)
- RLS policy `has_role(auth.uid(), 'super_admin')` protects role table mutations
- All role changes require confirmation dialog

---

## Implementation Steps

### Step 1: Create Admin Settings Page
1. Create `src/pages/admin/AdminSettings.tsx`
2. Implement tabbed UI with General, Email, Rate Limits, Feature Flags
3. Add form state management with localStorage persistence
4. Include save button with toast feedback

### Step 2: Create Access Control Page
1. Create `src/hooks/useRoleManagement.ts` for role queries/mutations
2. Create `src/pages/admin/AdminAccess.tsx`
3. Implement role overview stats cards
4. Add privileged users table with role management actions
5. Add confirmation dialogs for role changes

### Step 3: Register Routes
Update `src/App.tsx` to add:
```typescript
<Route path="settings" element={<AdminSettings />} />
<Route path="access" element={<AdminAccess />} />
```

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/pages/admin/AdminSettings.tsx` | Create |
| `src/pages/admin/AdminAccess.tsx` | Create |
| `src/hooks/useRoleManagement.ts` | Create |
| `src/App.tsx` | Modify (add 2 routes) |

---

## Technical Details

### Admin Settings State Shape
```typescript
interface AdminSettings {
  general: {
    platformName: string;
    supportEmail: string;
    defaultSmsLimit: number;
  };
  email: {
    senderName: string;
    replyToAddress: string;
    signature: string;
  };
  features: {
    maintenanceMode: boolean;
    betaFeatures: boolean;
    debugLogging: boolean;
  };
  rateLimits: {
    apiRequestsPerMinute: number;
    apiRequestsPerDay: number;
    defaultMonthlySms: number;
  };
}
```

### Role Management Hook Interface
```typescript
interface UseRoleManagement {
  privilegedUsers: ProfileWithRoles[];
  loading: boolean;
  grantRole: (userId: string, role: AppRole) => Promise<void>;
  revokeRole: (userId: string, role: AppRole) => Promise<void>;
  stats: {
    superAdminCount: number;
    adminCount: number;
    userCount: number;
  };
}
```

### UI Patterns Used
- `motion.div` for page animations (consistent with other admin pages)
- `GlassCard` for section containers
- `Tabs` component for settings organization
- `AlertDialog` for destructive action confirmations
- `StatusPill` for role badges
- `DropdownMenu` for row actions

---

## Accessibility & UX

- All form inputs have proper labels
- Confirmation dialogs for destructive actions
- Loading states with skeletons
- Toast notifications for all save/error states
- Responsive grid layouts for mobile compatibility
