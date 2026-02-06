

# Reduce JavaScript Bundle Size with Code Splitting

## Problem
All 20+ page components are eagerly imported in `App.tsx`, creating a single ~412 KiB JavaScript bundle. Users visiting the landing page (`/`) download code for Admin, Dashboard, Portal, and other pages they never see.

## Solution
Use React's `lazy()` and `Suspense` to code-split routes. Only the landing page and shared UI load upfront; everything else loads on-demand when navigated to.

## Changes

### File: `src/App.tsx`

**Replace** all static imports for route pages (lines 8-34) with `React.lazy()` calls:

```typescript
import { lazy, Suspense, useEffect } from "react";
// Keep only non-route imports (Toaster, TooltipProvider, etc.)

// Lazy-loaded routes
const Index = lazy(() => import("./pages/Index"));
const Contact = lazy(() => import("./pages/Contact"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminApplications = lazy(() => import("./pages/admin/AdminApplications"));
const AdminBrands = lazy(() => import("./pages/admin/AdminBrands"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminPortals = lazy(() => import("./pages/admin/AdminPortals"));
const AdminTemplates = lazy(() => import("./pages/admin/AdminTemplates"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAccess = lazy(() => import("./pages/admin/AdminAccess"));
const AdminDomains = lazy(() => import("./pages/admin/AdminDomains"));
const MyPortal = lazy(() => import("./pages/MyPortal"));
const DashboardLayout = lazy(() => import("./components/dashboard/DashboardLayout").then(m => ({ default: m.DashboardLayout })));
const Overview = lazy(() => import("./pages/dashboard/Overview"));
const Contacts = lazy(() => import("./pages/dashboard/Contacts"));
const APIKeys = lazy(() => import("./pages/dashboard/APIKeys"));
const Analytics = lazy(() => import("./pages/dashboard/Analytics"));
const Billing = lazy(() => import("./pages/dashboard/Billing"));
const Integrations = lazy(() => import("./pages/dashboard/Integrations"));
const Support = lazy(() => import("./pages/dashboard/Support"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const ApplicationPage = lazy(() => import("./pages/ApplicationPage"));
```

**Wrap** `<Routes>` with `<Suspense>` and a minimal loading fallback:

```typescript
<Suspense fallback={
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
}>
  <Routes>
    {/* ...all routes unchanged... */}
  </Routes>
</Suspense>
```

## Expected Impact
- Initial bundle for `/` drops from ~412 KiB to roughly ~150-180 KiB (landing page + shared libs only)
- Admin (~9 pages) and Dashboard (~8 pages) load only when users navigate there
- No visible change to user experience -- a brief spinner shows during chunk loads

## Files Modified
| File | Change |
|------|--------|
| `src/App.tsx` | Replace static imports with `lazy()`, wrap Routes in `Suspense` |

No other files need changes. All existing page components already use `export default`.
