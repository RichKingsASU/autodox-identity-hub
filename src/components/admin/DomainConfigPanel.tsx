import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Globe, 
  Copy, 
  Check, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Shield,
  ExternalLink,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { useDomainVerification } from "@/hooks/useDomainVerification";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DomainConfigPanelProps {
  brandId: string;
  currentDomain: string | null;
  onDomainChange: () => void;
}

type DomainStatus = "pending" | "verifying" | "verified" | "provisioning_ssl" | "active" | "failed";

const statusConfig: Record<DomainStatus, { label: string; pillStatus: "active" | "pending" | "suspended" | "unverified"; description: string }> = {
  pending: { 
    label: "DNS Pending", 
    pillStatus: "pending",
    description: "Add the DNS records below to verify domain ownership"
  },
  verifying: { 
    label: "Verifying...", 
    pillStatus: "pending",
    description: "Checking DNS records..."
  },
  verified: { 
    label: "Verified", 
    pillStatus: "active",
    description: "Domain verified. Ready to provision SSL."
  },
  provisioning_ssl: { 
    label: "SSL Pending", 
    pillStatus: "pending",
    description: "Provisioning SSL certificate..."
  },
  active: { 
    label: "Live", 
    pillStatus: "active",
    description: "Domain is active and serving traffic"
  },
  failed: { 
    label: "Failed", 
    pillStatus: "suspended",
    description: "Domain configuration failed"
  },
};

export function DomainConfigPanel({ brandId, currentDomain, onDomainChange }: DomainConfigPanelProps) {
  const [domain, setDomain] = useState(currentDomain || "");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const {
    domainState,
    isVerifying,
    isProvisioning,
    fetchDomainStatus,
    initiateDomainSetup,
    verifyDomain,
    provisionSSL,
    removeDomain,
  } = useDomainVerification(brandId);

  useEffect(() => {
    fetchDomainStatus();
  }, [fetchDomainStatus]);

  useEffect(() => {
    if (currentDomain) {
      setDomain(currentDomain);
    }
  }, [currentDomain]);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSetupDomain = async () => {
    if (!domain.trim()) return;
    const success = await initiateDomainSetup(domain);
    if (success) {
      onDomainChange();
    }
  };

  const handleVerify = async () => {
    const success = await verifyDomain();
    if (success) {
      onDomainChange();
    }
  };

  const handleProvisionSSL = async () => {
    const success = await provisionSSL();
    if (success) {
      onDomainChange();
    }
  };

  const handleRemoveDomain = async () => {
    const success = await removeDomain();
    if (success) {
      setDomain("");
      setShowRemoveDialog(false);
      onDomainChange();
    }
  };

  const txtRecordName = `_autodox-verify.${domain}`;
  const txtRecordValue = domainState.verificationToken || "";
  const netlifyTarget = "your-site.netlify.app"; // This should come from config

  const isConfigured = currentDomain && domainState.status;

  return (
    <div className="space-y-6">
      {/* Domain Input Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Custom Domain</h3>
        </div>

        {!isConfigured ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain Name</Label>
              <div className="flex gap-2">
                <Input
                  id="domain"
                  placeholder="verify.yourdomain.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSetupDomain} disabled={!domain.trim()}>
                  Configure
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the domain or subdomain you want to use for this brand's landing page
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Display */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{currentDomain}</p>
                    <p className="text-xs text-muted-foreground">
                      {domainState.status && statusConfig[domainState.status]?.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {domainState.status && (
                    <StatusPill status={statusConfig[domainState.status].pillStatus}>
                      {statusConfig[domainState.status].label}
                    </StatusPill>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowRemoveDialog(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Error Display */}
              {domainState.error && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  <p className="text-sm text-destructive">{domainState.error}</p>
                </div>
              )}
            </GlassCard>

            {/* DNS Instructions - Show for pending/failed states */}
            {(domainState.status === "pending" || domainState.status === "failed") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  DNS Configuration
                </h4>

                <div className="space-y-3">
                  {/* TXT Record */}
                  <GlassCard className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">TXT Record (Verification)</span>
                      <span className="text-xs text-muted-foreground">Step 1</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr_auto] gap-2 items-center">
                      <span className="text-xs text-muted-foreground">Name:</span>
                      <code className="text-sm bg-secondary px-2 py-1 rounded truncate">{txtRecordName}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(txtRecordName, "txt-name")}
                      >
                        {copiedField === "txt-name" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-[100px_1fr_auto] gap-2 items-center">
                      <span className="text-xs text-muted-foreground">Value:</span>
                      <code className="text-sm bg-secondary px-2 py-1 rounded truncate">{txtRecordValue}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(txtRecordValue, "txt-value")}
                      >
                        {copiedField === "txt-value" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </GlassCard>

                  {/* Netlify DNS Instructions */}
                  <GlassCard className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">DNS Routing (After Verification)</span>
                      <span className="text-xs text-muted-foreground">Step 2</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      After DNS verification, configure your domain to point to Netlify:
                    </p>
                    <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                      <li>For apex domains: Add an A record pointing to <code className="bg-secondary px-1 rounded">75.2.60.5</code></li>
                      <li>For subdomains: Add a CNAME pointing to <code className="bg-secondary px-1 rounded">{netlifyTarget}</code></li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Netlify will automatically provision SSL once the domain is added.
                    </p>
                  </GlassCard>
                </div>

                <Button onClick={handleVerify} disabled={isVerifying} className="w-full">
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Verify Domain
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Verified - Ready for SSL */}
            {domainState.status === "verified" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <GlassCard className="p-4 bg-green-500/10 border-green-500/20">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Domain ownership verified</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your domain is verified. Click below to provision an SSL certificate.
                  </p>
                </GlassCard>

                <Button onClick={handleProvisionSSL} disabled={isProvisioning} className="w-full">
                  {isProvisioning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Provisioning SSL...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Provision SSL Certificate
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* SSL Provisioning in Progress */}
            {domainState.status === "provisioning_ssl" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="p-4 bg-blue-500/10 border-blue-500/20">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-medium">SSL Certificate Provisioning</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    This usually takes a few minutes. The page will update automatically.
                  </p>
                  {domainState.sslStatus && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Status: {domainState.sslStatus}
                    </p>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {/* Active - Domain is Live */}
            {domainState.status === "active" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="p-4 bg-green-500/10 border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">Domain is Live</span>
                    </div>
                    <a
                      href={`https://${currentDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      Visit Site
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your brand landing page is now accessible at https://{currentDomain}
                  </p>
                </GlassCard>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Remove Domain Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this domain configuration? This will disable the custom domain and any SSL certificates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveDomain}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
