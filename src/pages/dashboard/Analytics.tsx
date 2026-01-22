import { RestrictedFeature } from "@/components/dashboard/RestrictedFeature";
import { GlassCard } from "@/components/ui/GlassCard";
import { BarChart3, TrendingUp, Users, MessageSquare } from "lucide-react";

const mockStats = [
  { label: "Total Verifications", value: "12,847", icon: MessageSquare, change: "+12.5%" },
  { label: "Success Rate", value: "94.2%", icon: TrendingUp, change: "+2.1%" },
  { label: "Active Users", value: "1,234", icon: Users, change: "+8.3%" },
  { label: "Avg. Response Time", value: "1.2s", icon: BarChart3, change: "-0.3s" },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          Monitor your verification success rates and usage patterns.
        </p>
      </div>

      <RestrictedFeature featureName="Analytics">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockStats.map((stat) => (
              <GlassCard key={stat.label} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-success">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </GlassCard>
            ))}
          </div>

          {/* Chart Placeholder */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Verification Trends</h3>
            <div className="h-64 flex items-center justify-center bg-muted/20 rounded-xl">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground">Chart visualization</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </RestrictedFeature>
    </div>
  );
}
