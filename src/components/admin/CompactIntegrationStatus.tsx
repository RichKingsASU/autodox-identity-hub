import { useIntegrationStatus, IntegrationStatus } from "@/hooks/useIntegrationStatus";
import { CheckCircle2, AlertCircle, Loader2, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: IntegrationStatus;
  name: string;
  detail?: string;
}

function StatusDot({ status, name, detail }: StatusDotProps) {
  const statusConfig = {
    connected: {
      color: "bg-emerald-500",
      icon: CheckCircle2,
      label: "Connected",
    },
    disconnected: {
      color: "bg-destructive",
      icon: XCircle,
      label: "Disconnected",
    },
    warning: {
      color: "bg-amber-500",
      icon: AlertCircle,
      label: "Warning",
    },
    checking: {
      color: "bg-muted-foreground",
      icon: Loader2,
      label: "Checking",
    },
  };

  const config = statusConfig[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "h-2 w-2 rounded-full transition-all",
            config.color,
            status === "checking" && "animate-pulse"
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="flex items-center gap-1.5">
          <config.icon className={cn(
            "h-3 w-3",
            status === "connected" && "text-emerald-500",
            status === "disconnected" && "text-destructive",
            status === "warning" && "text-amber-500",
            status === "checking" && "animate-spin"
          )} />
          <span className="font-medium">{name}</span>
          <span className="text-muted-foreground">• {config.label}</span>
        </div>
        {detail && <p className="text-muted-foreground mt-0.5">{detail}</p>}
      </TooltipContent>
    </Tooltip>
  );
}

export function CompactIntegrationStatus() {
  const { netlify, resend, database, isLoading } = useIntegrationStatus();

  // Calculate overall status
  const allConnected = 
    netlify.status === "connected" && 
    resend.status === "connected" && 
    database.status === "connected";
  
  const hasError = 
    netlify.status === "disconnected" || 
    resend.status === "disconnected" || 
    database.status === "disconnected";

  const overallStatus: IntegrationStatus = isLoading 
    ? "checking" 
    : allConnected 
      ? "connected" 
      : hasError 
        ? "disconnected" 
        : "warning";

  const overallConfig = {
    connected: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    disconnected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
    warning: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
    checking: { icon: Loader2, color: "text-muted-foreground", bg: "bg-muted" },
  };

  const overall = overallConfig[overallStatus];
  const OverallIcon = overall.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-default transition-colors",
          overall.bg
        )}>
          <OverallIcon className={cn(
            "h-3.5 w-3.5",
            overall.color,
            isLoading && "animate-spin"
          )} />
          <div className="flex items-center gap-1">
            <StatusDot status={netlify.status} name="Netlify" detail={netlify.detail} />
            <StatusDot status={resend.status} name="Resend" detail={resend.detail} />
            <StatusDot status={database.status} name="Database" detail={database.detail} />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="font-medium">
          {isLoading 
            ? "Checking integrations..." 
            : allConnected 
              ? "All systems operational" 
              : hasError 
                ? "Some integrations disconnected" 
                : "Integration warnings"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
