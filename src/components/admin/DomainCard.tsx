import { useState } from "react";
import { Globe, ExternalLink, Copy, Trash2, RefreshCw, Settings, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DomainStatusStepper } from "./DomainStatusStepper";
import type { DomainStatus } from "@/hooks/useBrandDomain";

interface DomainCardProps {
  domain: string;
  status: DomainStatus | null;
  brandName: string;
  brandId: string;
  sslStatus: string | null;
  verificationToken: string | null;
  domainError: string | null;
  onVerify: () => Promise<boolean>;
  onCheckStatus: () => Promise<boolean>;
  onRemove: () => Promise<boolean>;
  onConfigure: () => void;
  loading?: boolean;
}

const STATUS_CONFIG: Record<DomainStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  pending: { label: "Pending DNS", variant: "secondary", color: "text-amber-500" },
  verifying: { label: "Verifying", variant: "default", color: "text-blue-500" },
  verified: { label: "Verified", variant: "default", color: "text-emerald-500" },
  provisioning_ssl: { label: "Provisioning SSL", variant: "default", color: "text-blue-500" },
  active: { label: "Active", variant: "default", color: "text-emerald-500" },
  failed: { label: "Failed", variant: "destructive", color: "text-destructive" },
};

export function DomainCard({
  domain,
  status,
  brandName,
  brandId,
  sslStatus,
  verificationToken,
  domainError,
  onVerify,
  onCheckStatus,
  onRemove,
  onConfigure,
  loading = false,
}: DomainCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const statusConfig = status ? STATUS_CONFIG[status] : null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleAction = async (action: string, fn: () => Promise<boolean>) => {
    setActionLoading(action);
    await fn();
    setActionLoading(null);
  };

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${domain}?`)) return;
    await handleAction("remove", onRemove);
  };

  const isApexDomain = domain.split(".").length === 2;
  const showDNSInstructions = status && ["pending", "verifying", "failed"].includes(status);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              status === "active" ? "bg-emerald-500/10" : "bg-muted"
            )}>
              <Globe className={cn("h-5 w-5", status === "active" ? "text-emerald-500" : "text-muted-foreground")} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{domain}</span>
                {status === "active" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => window.open(`https://${domain}`, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Brand: {brandName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {statusConfig && (
              <Badge variant={statusConfig.variant} className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
            )}
            {sslStatus && status === "active" && (
              <Badge variant="outline" className="text-xs">
                SSL: {sslStatus}
              </Badge>
            )}
          </div>
        </div>

        {/* Error Display */}
        {domainError && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <span className="text-sm text-destructive">{domainError}</span>
          </div>
        )}

        {/* Status Stepper */}
        {status && status !== "active" && (
          <div className="mt-4">
            <DomainStatusStepper status={status} />
          </div>
        )}

        {/* Active Status */}
        {status === "active" && (
          <div className="mt-4 flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Domain is active with SSL</span>
          </div>
        )}
      </div>

      {/* Expandable DNS Instructions */}
      {showDNSInstructions && verificationToken && (
        <div className="border-t border-border">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <span>DNS Configuration</span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-3">
              {/* TXT Record */}
              <div className="p-3 bg-muted rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">TXT Record (Verification)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => copyToClipboard(verificationToken, "Verification token")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">_autodox-verify</code>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Value:</span>
                  <code className="bg-secondary px-1.5 py-0.5 rounded text-xs break-all">{verificationToken}</code>
                </div>
              </div>

              {/* A/CNAME Record */}
              <div className="p-3 bg-muted rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{isApexDomain ? "A Record" : "CNAME Record"}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => copyToClipboard(isApexDomain ? "75.2.60.5" : "autodox.netlify.app", "DNS value")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">
                    {isApexDomain ? "@" : domain.split(".")[0]}
                  </code>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Value:</span>
                  <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">
                    {isApexDomain ? "75.2.60.5" : "autodox.netlify.app"}
                  </code>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                DNS changes can take 5-10 minutes to propagate.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-border px-4 py-3 flex flex-wrap gap-2 bg-muted/30">
        {["pending", "verifying", "failed"].includes(status || "") && (
          <Button
            size="sm"
            onClick={() => handleAction("verify", onVerify)}
            disabled={actionLoading !== null || loading}
          >
            {actionLoading === "verify" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verify DNS
          </Button>
        )}

        {["verified", "provisioning_ssl"].includes(status || "") && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction("check", onCheckStatus)}
            disabled={actionLoading !== null || loading}
          >
            {actionLoading === "check" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Check Status
          </Button>
        )}

        <Button size="sm" variant="outline" onClick={onConfigure}>
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive ml-auto"
          onClick={handleRemove}
          disabled={actionLoading !== null || loading}
        >
          {actionLoading === "remove" ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Remove
        </Button>
      </div>
    </div>
  );
}
