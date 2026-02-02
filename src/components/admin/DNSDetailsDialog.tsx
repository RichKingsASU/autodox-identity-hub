import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, AlertCircle } from 'lucide-react';
import { Domain } from '@/hooks/useDomains';
import { toast } from 'sonner';

interface DNSDetailsDialogProps {
    domain: Domain | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const DNSDetailsDialog: React.FC<DNSDetailsDialogProps> = ({ domain, open, onOpenChange }) => {
    if (!domain) return null;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>DNS Configuration for {domain.domain}</DialogTitle>
                    <DialogDescription>
                        Configure these DNS records with your provider to verify ownership.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            These records are required to verify your domain and point it to our servers.
                        </AlertDescription>
                    </Alert>

                    {domain.dns_records && domain.dns_records.length > 0 ? (
                        <div className="space-y-2">
                            <Label>Required DNS Records:</Label>
                            {domain.dns_records.map((record: any, index: number) => (
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
                                        <span className="text-muted-foreground">Value:</span>
                                        <code className="ml-2 bg-secondary px-1 py-0.5 rounded text-xs break-all">
                                            {record.value}
                                        </code>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Alert variant="destructive">
                            <AlertDescription>
                                No DNS records found. Please try refreshing or contact support.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DNSDetailsDialog;
