import { RefreshCw, AlertTriangle, CheckCircle2, Loader2, Cloud, CloudOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface DNSSyncIndicatorProps {
  source: "netlify_api" | "fallback" | null;
  lastSynced: Date | null;
  loading: boolean;
  onRefresh?: () => void;
}

export function DNSSyncIndicator({ 
  source, 
  lastSynced, 
  loading, 
  onRefresh 
}: DNSSyncIndicatorProps) {
  const isLive = source === "netlify_api";
  const isFallback = source === "fallback";

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        <div className={cn(
          "p-2 rounded-lg",
          loading && "bg-muted",
          isLive && "bg-success/10",
          isFallback && "bg-amber-500/10"
        )}>
          {loading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          ) : isLive ? (
            <Cloud className="h-4 w-4 text-success" />
          ) : (
            <CloudOff className="h-4 w-4 text-amber-500" />
          )}
        </div>

        {/* Status Text */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              DNS Configuration
            </span>
            {loading ? (
              <Badge variant="secondary" className="text-xs">
                Syncing...
              </Badge>
            ) : isLive ? (
              <Badge variant="default" className="text-xs bg-success/20 text-success hover:bg-success/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Live API
              </Badge>
            ) : isFallback ? (
              <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 hover:bg-amber-500/30">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Cached
              </Badge>
            ) : null}
          </div>
          
          {lastSynced && !loading && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {isLive ? "Synced from Netlify" : "Using cached configuration"} •{" "}
              {formatDistanceToNow(lastSynced, { addSuffix: true })}
            </p>
          )}
          
          {isFallback && !loading && (
            <p className="text-xs text-amber-600 mt-0.5">
              Netlify API unavailable - using fallback values
            </p>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span className="hidden sm:inline text-xs">Sync</span>
        </Button>
      )}
    </div>
  );
}
