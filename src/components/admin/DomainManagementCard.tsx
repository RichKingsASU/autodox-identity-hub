import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Globe, CheckCircle2, AlertCircle, Loader2, Trash2, RefreshCw, Info } from 'lucide-react';
import { useDomains, type Domain, type DomainStatus } from '@/hooks/useDomains';
import DomainWizard from './DomainWizard';
import DNSDetailsDialog from './DNSDetailsDialog';
import { toast } from 'sonner';

interface DomainManagementCardProps {
    brandId: string;
    brandName: string;
}

const DomainManagementCard: React.FC<DomainManagementCardProps> = ({ brandId, brandName }) => {
    const [wizardOpen, setWizardOpen] = useState(false);
    const [dnsDialogDomain, setDnsDialogDomain] = useState<Domain | null>(null);
    const { domains, loading, verifyDNS, checkSSL, removeDomain, fetchDomains } = useDomains(brandId);

    const getStatusIcon = (status: DomainStatus) => {
        switch (status) {
            case 'active':
                return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'failed':
                return <AlertCircle className="h-4 w-4 text-red-600" />;
            case 'pending':
            case 'verifying':
            case 'verified':
            case 'provisioning_ssl':
                return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
            default:
                return <Globe className="h-4 w-4 text-gray-400" />;
        }
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

    const handleRemoveDomain = async (domainId: string, domainName: string) => {
        if (confirm(`Are you sure you want to remove ${domainName}?`)) {
            await removeDomain(domainId);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Custom Domains
                            </CardTitle>
                            <CardDescription>
                                Manage custom domains for this brand
                            </CardDescription>
                        </div>
                        <Button onClick={() => setWizardOpen(true)} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Domain
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {domains.length === 0 ? (
                        <Alert>
                            <Globe className="h-4 w-4" />
                            <AlertDescription>
                                No custom domains configured. Click "Add Domain" to get started.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-3">
                            {domains.map((domain) => (
                                <div
                                    key={domain.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        {getStatusIcon(domain.status)}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{domain.domain}</span>
                                                {domain.is_primary && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Primary
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                {getStatusBadge(domain.status)}
                                                {domain.ssl_status && (
                                                    <Badge variant="outline" className="text-xs">
                                                        SSL: {domain.ssl_status}
                                                    </Badge>
                                                )}
                                            </div>
                                            {domain.error_message && (
                                                <p className="text-sm text-red-600 mt-1">{domain.error_message}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {(domain.status === 'pending' || domain.status === 'verifying' || domain.status === 'failed') && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDnsDialogDomain(domain)}
                                                title="View DNS Records"
                                            >
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {domain.status === 'verifying' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => verifyDNS(domain.id)}
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 mr-1" />
                                                        Verify DNS
                                                    </>
                                                )}
                                            </Button>
                                        )}

                                        {(domain.status === 'verified' || domain.status === 'provisioning_ssl') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => checkSSL(domain.id)}
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 mr-1" />
                                                        Check SSL
                                                    </>
                                                )}
                                            </Button>
                                        )}

                                        {domain.status === 'active' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                                            >
                                                Visit
                                            </Button>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveDomain(domain.id, domain.domain)}
                                            disabled={loading}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <DomainWizard
                open={wizardOpen}
                onOpenChange={setWizardOpen}
                brandId={brandId}
                brandName={brandName}
            />

            <DNSDetailsDialog
                open={!!dnsDialogDomain}
                onOpenChange={(open) => !open && setDnsDialogDomain(null)}
                domain={dnsDialogDomain}
            />
        </>
    );
};

export default DomainManagementCard;
