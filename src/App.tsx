import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { toast } from "sonner";

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

const queryClient = new QueryClient();

const App = () => {
  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      toast.error("An error occurred. Please try again.");
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        }>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Application wizard */}
          <Route path="/application" element={<ApplicationPage />} />
          
          {/* User Portal Route (legacy) */}
          <Route path="/my-portal" element={<MyPortal />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="api-keys" element={<APIKeys />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="billing" element={<Billing />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="support" element={<Support />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Admin Console Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="brands" element={<AdminBrands />} />
            <Route path="domains" element={<AdminDomains />} />
            <Route path="templates" element={<AdminTemplates />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="portals" element={<AdminPortals />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="access" element={<AdminAccess />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
