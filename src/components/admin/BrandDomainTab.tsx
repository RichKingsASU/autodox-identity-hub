import { useState, useEffect } from "react";
import { Globe, Copy, CheckCircle2, AlertCircle, Loader2, Trash2, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBrandDomain, type DomainStatus } from "@/hooks/useBrandDomain";
import { toast } from "sonner";

interface BrandDomainTabProps {
  brandId: string;
  initialDomain?: string | null;
  onDomainChange?: () => void;
}

export function BrandDomainTab({ brandId, initialDomain, onDomainChange }: BrandDomainTabProps) {
  const [domainInput, setDomainInput] = useState(initialDomain || "");
  const { loading, domainState, fetchDomainState, setDomain, verifyDomain, provisionSSL, checkStatus, removeDomain } = useBrandDomain(brandId);

  useEffect(() => {
    fetchDomainState();
  }, [fetchDomainState]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getStatusBadge = (status: DomainStatus | null) => {
    if (!status) return null;
    
    const config: Record<DomainStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pending DNS", variant: "secondary" },
      verifying: { label: "Verifying", variant: "default" },
      verified: { label: "Verified", variant: "default" },
      provisioning_ssl: { label: "Provisioning SSL", variant: "default" },
      active: { label: "Active", variant: "default" },
      failed: { label: "Failed", variant: "destructive" },
    };

    const statusConfig = config[status] || config.pending;
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  const handleSetDomain = async () => {
    if (!domainInput.trim()) {
      toast.error("Please enter a domain name");
      return;
    }
    const success = await setDomain(domainInput.trim());
    if (success) {
      onDomainChange?.();
    }
  };

  const handleVerifyDNS = async () => {
    const success = await verifyDomain();
    if (success) {
      onDomainChange?.();
      // Auto-trigger SSL provisioning after verification
      await provisionSSL();
    }
  };

  const handleCheckSSL = async () => {
    await checkStatus();
    onDomainChange?.();
  };

  const handleRemoveDomain = async () => {
    if (!confirm("Are you sure you want to remove this domain?")) return;
    const success = await removeDomain();
    if (success) {
      setDomainInput("");
      onDomainChange?.();
    }
  };

  const isApexDomain = (domain: string) => {
    const parts = domain.split(".");
    return parts.length === 2;
  };

  const hasDomain = domainState?.domain;
  const showDNSInstructions = hasDomain && domainState.domain_status && ["pending", "verifying", "failed"].includes(domainState.domain_status);

  return (
    <div className="space-y-6">
      {/* Current Domain Status */}
      {hasDomain && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Current Domain
          </h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm">{domainState.domain}</span>
              {getStatusBadge(domainState.domain_status)}
              {domainState.ssl_status && (
                <Badge variant="outline" className="text-xs">
                  SSL: {domainState.ssl_status}
                </Badge>
              )}
            </div>
            {domainState.domain_status === "active" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`https://${domainState.domain}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Visit
              </Button>
            )}
          </div>
          {domainState.domain_error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{domainState.domain_error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Domain Input */}
      <div className="space-y-3">
        <Label htmlFor="domain">Domain Name</Label>
        <div className="flex gap-2">
          <Input
            id="domain"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="example.com or app.example.com"
            disabled={loading}
          />
          <Button onClick={handleSetDomain} disabled={loading || !domainInput.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter your custom domain (apex domain or subdomain)
        </p>
      </div>

      {/* DNS Instructions */}
      {showDNSInstructions && domainState.domain_verification_token && (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Add these DNS records at your domain registrar to verify ownership and point to our servers.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Label>Required DNS Records:</Label>
            
            {/* TXT Record for verification */}
            <div className="p-3 bg-muted rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">TXT Record (Verification)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(domainState.domain_verification_token!)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Name:</span>
                <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">
                  _autodox-verify
                </code>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Value:</span>
                <code className="bg-secondary px-1.5 py-0.5 rounded text-xs break-all">
                  {domainState.domain_verification_token}
                </code>
              </div>
            </div>

            {/* A Record or CNAME */}
            <div className="p-3 bg-muted rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {isApexDomain(domainState.domain!) ? "A Record" : "CNAME Record"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(isApexDomain(domainState.domain!) ? "75.2.60.5" : "autodox.netlify.app")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Name:</span>
                <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">
                  {isApexDomain(domainState.domain!) ? "@" : domainState.domain!.split(".")[0]}
                </code>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Value:</span>
                <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">
                  {isApexDomain(domainState.domain!) ? "75.2.60.5" : "autodox.netlify.app"}
                </code>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              DNS changes can take 5-10 minutes to propagate. Click "Verify DNS" after adding the records.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {hasDomain && (
        <div className="flex flex-wrap gap-2">
          {["pending", "verifying", "failed"].includes(domainState.domain_status || "") && (
            <Button onClick={handleVerifyDNS} disabled={loading} variant="default">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Verify DNS
            </Button>
          )}

          {["verified", "provisioning_ssl"].includes(domainState.domain_status || "") && (
            <Button onClick={handleCheckSSL} disabled={loading} variant="outline">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Check SSL Status
            </Button>
          )}

          {domainState.domain_status === "active" && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Domain is active and SSL is provisioned</span>
            </div>
          )}

          <Button onClick={handleRemoveDomain} disabled={loading} variant="ghost" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Remove Domain
          </Button>
        </div>
      )}
    </div>
  );
}
