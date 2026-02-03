import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminBrands from "./pages/admin/AdminBrands";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPortals from "./pages/admin/AdminPortals";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAccess from "./pages/admin/AdminAccess";
import AdminDomains from "./pages/admin/AdminDomains";
import MyPortal from "./pages/MyPortal";

// Dashboard pages
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Contacts from "./pages/dashboard/Contacts";
import APIKeys from "./pages/dashboard/APIKeys";
import Analytics from "./pages/dashboard/Analytics";
import Billing from "./pages/dashboard/Billing";
import Integrations from "./pages/dashboard/Integrations";
import Support from "./pages/dashboard/Support";
import Settings from "./pages/dashboard/Settings";
import ApplicationPage from "./pages/ApplicationPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
