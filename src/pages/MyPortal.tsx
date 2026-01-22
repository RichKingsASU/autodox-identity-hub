import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  FileText,
  MessageSquare,
  Zap,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePortalConfig } from "@/hooks/usePortalConfig";
import { useAuth } from "@/hooks/useAuth";
import {
  ThemedPortalShell,
  ThemedStatCard,
  ThemedButton,
} from "@/components/portal/ThemedPortalShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function MyPortal() {
  const navigate = useNavigate();
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { config, loading: configLoading } = usePortalConfig();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  if (authLoading || configLoading || !mounted) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userName = profile?.first_name || "User";
  const brandName = config?.brand_name || "My Portal";
  const primaryColor = config?.primary_color || "#8B5CF6";
  const secondaryColor = config?.secondary_color || "#EC4899";

  return (
    <ThemedPortalShell
      config={config}
      userName={userName}
      onSignOut={handleSignOut}
    >
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, <span style={{ color: primaryColor }}>{userName}</span>
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your {brandName} account today.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ThemedStatCard
          title="Total Messages"
          value="12,847"
          icon={MessageSquare}
          trend={{ value: "12% from last month", positive: true }}
        />
        <ThemedStatCard
          title="Delivery Rate"
          value="99.2%"
          icon={CheckCircle2}
          trend={{ value: "0.3% improvement", positive: true }}
        />
        <ThemedStatCard
          title="Active Campaigns"
          value="8"
          icon={Zap}
        />
        <ThemedStatCard
          title="API Calls Today"
          value="3,421"
          icon={Activity}
          trend={{ value: "8% from yesterday", positive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" style={{ color: primaryColor }} />
                Recent Activity
              </h2>
              <ThemedButton variant="outline">View All</ThemedButton>
            </div>
            
            <div className="space-y-4">
              {[
                { time: "2 min ago", action: "SMS delivered to +1 (555) 123-4567", status: "success" },
                { time: "15 min ago", action: "Campaign 'Summer Sale' started", status: "info" },
                { time: "1 hour ago", action: "API key rotated successfully", status: "success" },
                { time: "3 hours ago", action: "Bulk import completed: 1,247 contacts", status: "success" },
                { time: "Yesterday", action: "Monthly report generated", status: "info" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        item.status === "success" ? "#10B981" : primaryColor,
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5" style={{ color: primaryColor }} />
              Quick Actions
            </h2>
            
            <div className="space-y-3">
              <ThemedButton variant="primary" className="w-full justify-center">
                Send New Message
              </ThemedButton>
              <ThemedButton variant="secondary" className="w-full justify-center">
                Create Campaign
              </ThemedButton>
              <ThemedButton variant="outline" className="w-full justify-center">
                View API Docs
              </ThemedButton>
            </div>

            {/* Usage Meter */}
            <div className="mt-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Monthly Usage</span>
                <span className="font-medium">7,421 / 10,000</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "74%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                2,579 messages remaining this month
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Performance Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" style={{ color: primaryColor }} />
              Message Analytics
            </h2>
            <div className="flex gap-2">
              <ThemedButton variant="outline">7 Days</ThemedButton>
              <ThemedButton variant="secondary">30 Days</ThemedButton>
            </div>
          </div>
          
          {/* Placeholder chart area */}
          <div
            className="h-64 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}05)`,
              border: `1px dashed ${primaryColor}30`,
            }}
          >
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Chart visualization coming soon</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </ThemedPortalShell>
  );
}
