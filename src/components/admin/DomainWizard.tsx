import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { useDomains, type Domain, type DomainStatus } from '@/hooks/useDomains';
import { toast } from 'sonner';

interface DomainWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    brandId: string;
    brandName: string;
}

const DomainWizard: React.FC<DomainWizardProps> = ({ open, onOpenChange, brandId, brandName }) => {
    const [step, setStep] = useState(1);
    const [domainName, setDomainName] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);
    const [currentDomain, setCurrentDomain] = useState<Domain | null>(null);

    const { addDomain, verifyDNS, checkSSL, loading } = useDomains(brandId);

    const handleAddDomain = async () => {
        const domain = await addDomain(brandId, domainName, isPrimary);
        if (domain) {
            setCurrentDomain(domain);
            setStep(2);
        }
    };

    const handleVerifyDNS = async () => {
        if (!currentDomain) return;
        const verified = await verifyDNS(currentDomain.id);
        if (verified) {
            setStep(3);
        }
    };

    const handleCheckSSL = async () => {
        if (!currentDomain) return;
        const active = await checkSSL(currentDomain.id);
        if (active) {
            setStep(4);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const resetWizard = () => {
        setStep(1);
        setDomainName('');
        setIsPrimary(false);
        setCurrentDomain(null);
    };

    const handleClose = () => {
        resetWizard();
        onOpenChange(false);
    };

    const getStatusBadge = (status: DomainStatus) => {
        const statusConfig = {
            pending: { label: 'Pending', variant: 'secondary' as const },
            verifying: { label: 'Verifying DNS', variant: 'default' as const },
            verified: { label: 'DNS Verified', variant: 'default' as const },
            provisioning_ssl: { label: 'Provisioning SSL', variant: 'default' as const },
            active: { label: 'Active', variant: 'default' as const },
            failed: { label: 'Failed', variant: 'destructive' as const },
        };

        const config = statusConfig[status] || statusConfig.pending;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add Custom Domain to {brandName}</DialogTitle>
                    <DialogDescription>
                        Follow these steps to add and activate a custom domain for your brand.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Step 1: Enter Domain */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="domain">Domain Name</Label>
                                <Input
                                    id="domain"
                                    placeholder="example.com"
                                    value={domainName}
                                    onChange={(e) => setDomainName(e.target.value)}
                                    disabled={loading}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Enter your custom domain (e.g., verify.example.com or example.com)
                                </p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="primary"
                                    checked={isPrimary}
                                    onChange={(e) => setIsPrimary(e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <Label htmlFor="primary" className="font-normal">
                                    Set as primary domain for this brand
                                </Label>
                            </div>

                            <Button onClick={handleAddDomain} disabled={!domainName || loading} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Domain
                            </Button>
                        </div>
                    )}

                    {/* Step 2: DNS Configuration */}
                    {step === 2 && currentDomain && (
                        <div className="space-y-4">
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Configure your DNS settings with your domain provider to point to Netlify.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Domain Status:</span>
                                    {getStatusBadge(currentDomain.status)}
                                </div>

                                {currentDomain.dns_records && currentDomain.dns_records.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Required DNS Records:</Label>
                                        {currentDomain.dns_records.map((record: any, index: number) => (
                                            <div key={index} className="p-3 bg-muted rounded-md space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">Type: {record.type}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(record.value)}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Name:</span> {record.hostname || '@'}
                                                </div>
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Value:</span> {record.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Alert>
                                    <AlertDescription>
                                        After adding these DNS records, it may take 5-10 minutes for changes to propagate.
                                    </AlertDescription>
                                </Alert>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleVerifyDNS} disabled={loading} className="flex-1">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Verify DNS
                                </Button>
                                <Button variant="outline" onClick={handleClose}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: SSL Provisioning */}
                    {step === 3 && currentDomain && (
                        <div className="space-y-4">
                            <Alert>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription>
                                    DNS verified successfully! SSL certificate provisioning is in progress.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Domain Status:</span>
                                    {getStatusBadge(currentDomain.status)}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="font-medium">SSL Status:</span>
                                    <Badge>{currentDomain.ssl_status || 'Pending'}</Badge>
                                </div>

                                <Alert>
                                    <AlertDescription>
                                        SSL certificate provisioning typically takes 1-2 hours. You can check the status anytime.
                                    </AlertDescription>
                                </Alert>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleCheckSSL} disabled={loading} className="flex-1">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Check SSL Status
                                </Button>
                                <Button variant="outline" onClick={handleClose}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && currentDomain && (
                        <div className="space-y-4">
                            <Alert className="border-green-600">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-600">
                                    Domain is now active and ready to use!
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Domain:</span>
                                    <a
                                        href={`https://${currentDomain.domain}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-primary hover:underline"
                                    >
                                        {currentDomain.domain}
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Status:</span>
                                    {getStatusBadge(currentDomain.status)}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="font-medium">SSL:</span>
                                    <Badge variant="default">Issued</Badge>
                                </div>
                            </div>

                            <Button onClick={handleClose} className="w-full">
                                Done
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DomainWizard;
