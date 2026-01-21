import { useState } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Key, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  X,
  Clock,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/ui/StatusPill";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { AIAssistant } from "./AIAssistant";
import { SMSLogsTable } from "./SMSLogsTable";
import { APIKeysTable } from "./APIKeysTable";

interface DashboardShellProps {
  isPending?: boolean;
  userName: string;
}

const navItems = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: MessageSquare, label: "SMS Logs", id: "sms" },
  { icon: Key, label: "API Keys", id: "api" },
  { icon: Settings, label: "Settings", id: "settings" },
];

export function DashboardShell({ isPending = false, userName }: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:transform-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
            <span className="text-xl font-bold gradient-text">Autodox</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 squishy",
                  activeTab === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                {userName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
                <StatusPill status={isPending ? "pending" : "approved"} className="text-[10px]">
                  {isPending ? "Pending" : "Approved"}
                </StatusPill>
              </div>
            </div>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-foreground capitalize">{activeTab}</h1>
          </div>
        </header>

        {/* Pending Banner */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-warning/10 border-b border-warning/30 px-6 py-3 flex items-center gap-3"
          >
            <Clock className="h-5 w-5 text-warning" />
            <span className="text-sm text-warning font-medium">
              Your application is under review. Some features are temporarily limited.
            </span>
          </motion.div>
        )}

        {/* Content */}
        <div className="p-6">
          {isPending ? (
            <PendingContent activeTab={activeTab} />
          ) : (
            <ActiveContent activeTab={activeTab} />
          )}
        </div>
      </main>

      {/* AI Assistant */}
      <AIAssistant context={activeTab} />
    </div>
  );
}

function PendingContent({ activeTab }: { activeTab: string }) {
  return (
    <div className="space-y-6">
      <GlassCard className="relative overflow-hidden">
        <div className="skeleton-blur">
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-secondary rounded-xl" />
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-warning mx-auto mb-3" />
            <p className="text-foreground font-medium">Review in Progress</p>
            <p className="text-sm text-muted-foreground mt-1">
              This feature will be available once your application is approved.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function ActiveContent({ activeTab }: { activeTab: string }) {
  switch (activeTab) {
    case "sms":
      return <SMSLogsTable />;
    case "api":
      return <APIKeysTable />;
    case "settings":
      return (
        <GlassCard>
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <p className="text-muted-foreground">Configure your account preferences and integrations.</p>
        </GlassCard>
      );
    default:
      return <OverviewDashboard />;
  }
}

function OverviewDashboard() {
  const stats = [
    { label: "Total Verifications", value: "12,847", change: "+12.5%" },
    { label: "Success Rate", value: "98.7%", change: "+0.3%" },
    { label: "Avg. Response Time", value: "1.2s", change: "-0.1s" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <GlassCard>
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="text-muted-foreground text-sm">
          Activity feed will appear here once you start processing verifications.
        </div>
      </GlassCard>
    </div>
  );
}
