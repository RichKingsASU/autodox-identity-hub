import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  Globe,
  Mail,
  Database,
  Plug
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useIntegrationStatus, IntegrationStatus, IntegrationInfo } from "@/hooks/useIntegrationStatus";
import { cn } from "@/lib/utils";

interface IntegrationStatusPanelProps {
  compact?: boolean;
  showRefresh?: boolean;
  autoRefresh?: boolean;
}

const statusConfig: Record<IntegrationStatus, { icon: typeof CheckCircle2; color: string; bgColor: string }> = {
  connected: { 
    icon: CheckCircle2, 
    color: "text-success", 
    bgColor: "bg-success/10" 
  },
  disconnected: { 
    icon: XCircle, 
    color: "text-destructive", 
    bgColor: "bg-destructive/10" 
  },
  warning: { 
    icon: AlertTriangle, 
    color: "text-amber-500", 
    bgColor: "bg-amber-500/10" 
  },
  checking: { 
    icon: Loader2, 
    color: "text-muted-foreground", 
    bgColor: "bg-muted" 
  },
};

const integrationIcons: Record<string, typeof Globe> = {
  Netlify: Globe,
  "Email (Resend)": Mail,
  Database: Database,
};

function IntegrationStatusRow({ info, compact }: { info: IntegrationInfo; compact?: boolean }) {
  const config = statusConfig[info.status];
  const StatusIcon = config.icon;
  const IntegrationIcon = integrationIcons[info.name] || Plug;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center justify-between p-3 rounded-lg transition-colors",
        compact ? "bg-transparent" : "bg-secondary/30"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", config.bgColor)}>
          <IntegrationIcon className={cn("h-4 w-4", config.color)} />
        </div>
        <div>
          <p className="font-medium text-sm text-foreground">{info.name}</p>
          {!compact && info.detail && (
            <p className="text-xs text-muted-foreground">{info.detail}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-sm font-medium", config.color)}>
          {info.message}
        </span>
        <StatusIcon 
          className={cn(
            "h-4 w-4",
            config.color,
            info.status === "checking" && "animate-spin"
          )} 
        />
      </div>
    </motion.div>
  );
}

export function IntegrationStatusPanel({ 
  compact = false, 
  showRefresh = true,
  autoRefresh = false 
}: IntegrationStatusPanelProps) {
  const { netlify, resend, database, isLoading, refresh } = useIntegrationStatus(autoRefresh);

  const integrations = [netlify, resend, database];
  const allConnected = integrations.every((i) => i.status === "connected");
  const hasWarnings = integrations.some((i) => i.status === "warning");
  const hasErrors = integrations.some((i) => i.status === "disconnected");

  const overallStatus = hasErrors ? "error" : hasWarnings ? "warning" : allConnected ? "healthy" : "checking";

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        {integrations.map((info) => {
          const config = statusConfig[info.status];
          const StatusIcon = config.icon;
          const IntegrationIcon = integrationIcons[info.name] || Plug;
          
          return (
            <div
              key={info.name}
              className="flex items-center gap-2 text-sm"
              title={`${info.name}: ${info.message}`}
            >
              <IntegrationIcon className="h-4 w-4 text-muted-foreground" />
              <StatusIcon 
                className={cn(
                  "h-4 w-4",
                  config.color,
                  info.status === "checking" && "animate-spin"
                )} 
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <GlassCard className="relative overflow-hidden">
      {/* Background gradient based on overall status */}
      <div 
        className={cn(
          "absolute inset-0 opacity-5",
          overallStatus === "healthy" && "bg-gradient-to-br from-success to-emerald-500",
          overallStatus === "warning" && "bg-gradient-to-br from-amber-500 to-orange-500",
          overallStatus === "error" && "bg-gradient-to-br from-destructive to-red-500",
          overallStatus === "checking" && "bg-gradient-to-br from-muted to-muted"
        )}
      />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Integrations</h3>
          </div>
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {integrations.map((info, index) => (
            <motion.div
              key={info.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <IntegrationStatusRow info={info} />
            </motion.div>
          ))}
        </div>

        {/* Overall status summary */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Status</span>
            <span className={cn(
              "font-medium",
              overallStatus === "healthy" && "text-success",
              overallStatus === "warning" && "text-amber-500",
              overallStatus === "error" && "text-destructive",
              overallStatus === "checking" && "text-muted-foreground"
            )}>
              {overallStatus === "healthy" && "All Systems Operational"}
              {overallStatus === "warning" && "Some Integrations Need Attention"}
              {overallStatus === "error" && "Connection Issues Detected"}
              {overallStatus === "checking" && "Checking..."}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// Compact status pills for use in headers/banners
export function IntegrationStatusPills() {
  const { netlify, resend, database } = useIntegrationStatus();
  const integrations = [netlify, resend, database];

  return (
    <div className="flex items-center gap-2">
      {integrations.map((info) => {
        const config = statusConfig[info.status];
        const StatusIcon = config.icon;
        
        return (
          <div
            key={info.name}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
              config.bgColor
            )}
            title={`${info.name}: ${info.message}`}
          >
            <StatusIcon 
              className={cn(
                "h-3 w-3",
                config.color,
                info.status === "checking" && "animate-spin"
              )} 
            />
            <span className={config.color}>{info.name.split(" ")[0]}</span>
          </div>
        );
      })}
    </div>
  );
}
