import { motion } from "framer-motion";
import { Building2, Users, MessageSquare, TrendingUp, Activity } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Brand } from "@/hooks/useBrands";

interface AdminOverviewProps {
  brands: Brand[];
  loading: boolean;
}

export function AdminOverview({ brands, loading }: AdminOverviewProps) {
  const activeBrands = brands.filter((b) => b.status === "active").length;
  const provisioningBrands = brands.filter((b) => b.status === "provisioning").length;
  const totalUsage = brands.reduce((sum, b) => sum + b.current_month_usage, 0);
  const totalLimit = brands.reduce((sum, b) => sum + b.monthly_sms_limit, 0);

  const stats = [
    {
      label: "Total Brands",
      value: brands.length,
      change: `${activeBrands} active`,
      icon: Building2,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Provisioning",
      value: provisioningBrands,
      change: "Pending setup",
      icon: Activity,
      color: "from-amber-500 to-orange-500",
    },
    {
      label: "Total SMS Usage",
      value: totalUsage.toLocaleString(),
      change: `of ${totalLimit.toLocaleString()}`,
      icon: MessageSquare,
      color: "from-emerald-500 to-green-500",
    },
    {
      label: "Usage Rate",
      value: totalLimit > 0 ? `${Math.round((totalUsage / totalLimit) * 100)}%` : "0%",
      change: "This month",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <GlassCard key={i} className="animate-pulse">
            <div className="h-24 bg-secondary rounded-lg" />
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`} />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                  <stat.icon className="h-6 w-6 text-foreground" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        {brands.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No brands yet. Create your first brand to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {brands.slice(0, 5).map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{brand.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{brand.status}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(brand.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
