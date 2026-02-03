import { useState } from "react";
import { Globe, ExternalLink, RefreshCw, Loader2, Plus, Shield, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { DomainWithBrand } from "@/hooks/useDomainManager";
import type { DomainStatus } from "@/hooks/useBrandDomain";

interface DomainsTableProps {
  domains: DomainWithBrand[];
  loading: boolean;
  onVerifyDNS: (brandId: string) => Promise<boolean>;
  onActivateDomain: (brandId: string) => Promise<boolean>;
  onRetrySSL: (brandId: string) => Promise<boolean>;
  onAddDomain: () => void;
}

const STATUS_CONFIG: Record<DomainStatus, { 
  label: string; 
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: typeof CheckCircle2;
  color: string;
}> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock, color: "text-amber-500" },
  verifying: { label: "Verifying", variant: "default", icon: RefreshCw, color: "text-blue-500" },
  verified: { label: "Verified", variant: "default", icon: CheckCircle2, color: "text-emerald-500" },
  provisioning_ssl: { label: "SSL Provisioning", variant: "default", icon: Shield, color: "text-blue-500" },
  active: { label: "Active", variant: "default", icon: CheckCircle2, color: "text-emerald-500" },
  failed: { label: "Error", variant: "destructive", icon: AlertCircle, color: "text-destructive" },
};

export function DomainsTable({
  domains,
  loading,
  onVerifyDNS,
  onActivateDomain,
  onRetrySSL,
  onAddDomain,
}: DomainsTableProps) {
  const [actionLoading, setActionLoading] = useState<{ brandId: string; action: string } | null>(null);

  const handleAction = async (brandId: string, action: string, fn: () => Promise<boolean>) => {
    setActionLoading({ brandId, action });
    await fn();
    setActionLoading(null);
  };

  const isLoading = (brandId: string, action: string) => 
    actionLoading?.brandId === brandId && actionLoading?.action === action;

  const getStatusBadge = (status: DomainStatus | null) => {
    if (!status) return <Badge variant="outline">Not Configured</Badge>;
    
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={cn("gap-1", config.color)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getSSLBadge = (sslStatus: string | null, domainStatus: DomainStatus | null) => {
    if (!sslStatus || domainStatus !== "active") return null;
    
    const isActive = sslStatus === "issued" || sslStatus === "active";
    
    return (
      <Badge variant="outline" className={cn(
        "gap-1 text-xs",
        isActive ? "border-emerald-500/50 text-emerald-600" : "border-amber-500/50 text-amber-600"
      )}>
        <Shield className="h-3 w-3" />
        SSL: {sslStatus}
      </Badge>
    );
  };

  const renderActions = (domain: DomainWithBrand) => {
    const status = domain.domain_status;
    
    // No domain configured
    if (!domain.domain) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={onAddDomain}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Domain
        </Button>
      );
    }

    const buttons = [];

    // Verify DNS - for pending/verifying/failed states
    if (["pending", "verifying", "failed"].includes(status || "")) {
      buttons.push(
        <Button
          key="verify"
          size="sm"
          onClick={() => handleAction(domain.id, "verify", () => onVerifyDNS(domain.id))}
          disabled={isLoading(domain.id, "verify") || loading}
        >
          {isLoading(domain.id, "verify") ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Verify DNS
        </Button>
      );
    }

    // Activate Domain - for verified state
    if (status === "verified") {
      buttons.push(
        <Button
          key="activate"
          size="sm"
          onClick={() => handleAction(domain.id, "activate", () => onActivateDomain(domain.id))}
          disabled={isLoading(domain.id, "activate") || loading}
        >
          {isLoading(domain.id, "activate") ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Shield className="h-4 w-4 mr-1" />
          )}
          Activate Domain
        </Button>
      );
    }

    // Retry SSL - for failed state or provisioning_ssl
    if (status === "failed" || status === "provisioning_ssl") {
      buttons.push(
        <Button
          key="retry"
          size="sm"
          variant="outline"
          onClick={() => handleAction(domain.id, "retry", () => onRetrySSL(domain.id))}
          disabled={isLoading(domain.id, "retry") || loading}
        >
          {isLoading(domain.id, "retry") ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Retry SSL
        </Button>
      );
    }

    // Active domain - just show visit button
    if (status === "active") {
      buttons.push(
        <Button
          key="visit"
          size="sm"
          variant="ghost"
          onClick={() => window.open(`https://${domain.domain}`, "_blank")}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Visit
        </Button>
      );
    }

    return <div className="flex gap-2">{buttons}</div>;
  };

  if (domains.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No domains configured</h3>
        <p className="text-muted-foreground mb-4">Add a custom domain to get started</p>
        <Button onClick={onAddDomain}>
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Domain</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SSL Status</TableHead>
            <TableHead>Last Error</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((domain) => (
            <TableRow key={domain.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Globe className={cn(
                    "h-4 w-4",
                    domain.domain_status === "active" ? "text-emerald-500" : "text-muted-foreground"
                  )} />
                  <span className="font-mono text-sm">
                    {domain.domain || <span className="text-muted-foreground italic">Not configured</span>}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">{domain.name}</span>
              </TableCell>
              <TableCell>
                {getStatusBadge(domain.domain_status)}
              </TableCell>
              <TableCell>
                {domain.domain ? (
                  getSSLBadge(domain.ssl_status, domain.domain_status) || 
                  <span className="text-muted-foreground text-sm">—</span>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                {domain.domain_error ? (
                  <span className="text-sm text-destructive max-w-[200px] truncate block" title={domain.domain_error}>
                    {domain.domain_error}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {renderActions(domain)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
