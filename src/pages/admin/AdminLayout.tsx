import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";

export default function AdminLayout() {
  const { user, isAdmin, isSuperAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin console...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GlassCard className="max-w-md text-center">
            <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access the admin console. Please contact a super admin if you believe this is an error.
            </p>
            <button
              onClick={() => navigate("/")}
              className="text-primary hover:underline"
            >
              Return to Home
            </button>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar isSuperAdmin={isSuperAdmin} onSignOut={handleSignOut} />
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
