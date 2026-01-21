import { motion } from "framer-motion";
import { Building2, MessageSquare, TrendingUp, Activity, Globe, Zap } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Brand } from "@/hooks/useBrands";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface AdminOverviewProps {
  brands: Brand[];
  loading: boolean;
}

// Mock data for aggregate traffic chart
const generateTrafficData = () => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      verifications: Math.floor(Math.random() * 5000) + 2000,
      sms: Math.floor(Math.random() * 3000) + 1000,
    });
  }
  return data;
};

const trafficData = generateTrafficData();

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
      {/* Global Uptime Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-emerald-500/10 border border-success/20 p-4"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.1),transparent_50%)]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
              <Globe className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Global Platform Uptime</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-success">99.9%</span>
                <span className="text-xs text-muted-foreground">Last 30 days</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Avg Response</p>
              <p className="font-semibold text-foreground">42ms</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Requests/min</p>
              <p className="font-semibold text-foreground">12.4K</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/20">
              <Zap className="h-4 w-4 text-success" />
              <span className="text-success font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>
      </motion.div>

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

      {/* Aggregate Traffic Chart */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Aggregate Traffic</h3>
            <p className="text-sm text-muted-foreground">Platform-wide verifications & SMS volume (30 days)</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Verifications</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-success" />
              <span className="text-muted-foreground">SMS Sent</span>
            </div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficData}>
              <defs>
                <linearGradient id="colorVerifications" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSms" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dx={-10}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="verifications"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVerifications)"
                name="Verifications"
              />
              <Area
                type="monotone"
                dataKey="sms"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSms)"
                name="SMS Sent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

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
