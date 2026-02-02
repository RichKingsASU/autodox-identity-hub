import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DomainStatus = 'pending' | 'verifying' | 'verified' | 'provisioning_ssl' | 'active' | 'failed';

export interface Domain {
    id: string;
    brand_id: string;
    domain: string;
    is_primary: boolean;
    status: DomainStatus;
    verification_token: string | null;
    verified_at: string | null;
    ssl_status: string | null;
    netlify_domain_id: string | null;
    error_message: string | null;
    dns_records: any[];
    created_at: string;
    updated_at: string;
}

export interface DomainEvent {
    id: string;
    domain_id: string;
    event_type: string;
    details: any;
    performed_by: string | null;
    created_at: string;
}

export const useDomains = (brandId?: string) => {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch domains for a brand
    const fetchDomains = async (targetBrandId?: string) => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase.from('domains').select('*');

            if (targetBrandId || brandId) {
                query = query.eq('brand_id', targetBrandId || brandId);
            }

            const { data, error: fetchError } = await query.order('is_primary', { ascending: false }).order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setDomains(data || []);
        } catch (err: any) {
            setError(err.message);
            toast.error(`Failed to fetch domains: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Add a new domain
    const addDomain = async (targetBrandId: string, domainName: string, isPrimary: boolean = false): Promise<Domain | null> => {
        setLoading(true);
        setError(null);

        try {
            // Validate domain format
            const { data: isValid, error: validateError } = await supabase.rpc('validate_domain', { domain_name: domainName });

            if (validateError) throw validateError;
            if (!isValid) {
                throw new Error('Invalid domain format or reserved domain');
            }

            // Create domain record
            const { data: newDomain, error: insertError } = await supabase
                .from('domains')
                .insert({
                    brand_id: targetBrandId,
                    domain: domainName.toLowerCase().trim(),
                    is_primary: isPrimary,
                    status: 'pending' as DomainStatus,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Call edge function to add domain to Netlify
            const { data: netlifyData, error: netlifyError } = await supabase.functions.invoke('add-domain-to-netlify', {
                body: { domain_id: newDomain.id },
            });

            if (netlifyError) {
                toast.error(`Failed to add domain to Netlify: ${netlifyError.message}`);
                // Domain record exists but Netlify addition failed
                // User can retry via "Retry" button
            } else {
                toast.success(`Domain ${domainName} added successfully! DNS records ready.`);
            }

            // Refresh domains list
            await fetchDomains(targetBrandId);

            return newDomain;
        } catch (err: any) {
            setError(err.message);
            toast.error(`Failed to add domain: ${err.message}`);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Verify DNS configuration
    const verifyDNS = async (domainId: string): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: verifyError } = await supabase.functions.invoke('verify-domain-dns', {
                body: { domain_id: domainId },
            });

            if (verifyError) throw verifyError;

            if (data.verified) {
                toast.success('DNS verified successfully! SSL provisioning will begin shortly.');
                await fetchDomains();
                return true;
            } else {
                toast.info('DNS not yet verified. Please check your DNS settings and try again.');
                return false;
            }
        } catch (err: any) {
            setError(err.message);
            toast.error(`Failed to verify DNS: ${err.message}`);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Check SSL status
    const checkSSL = async (domainId: string): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: sslError } = await supabase.functions.invoke('check-ssl-status', {
                body: { domain_id: domainId },
            });

            if (sslError) throw sslError;

            if (data.ssl_active) {
                toast.success('SSL certificate issued! Domain is now active.');
                await fetchDomains();
                return true;
            } else {
                toast.info(`SSL provisioning in progress. Status: ${data.ssl_state}`);
                return false;
            }
        } catch (err: any) {
            setError(err.message);
            toast.error(`Failed to check SSL status: ${err.message}`);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Remove a domain
    const removeDomain = async (domainId: string): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const { error: deleteError } = await supabase
                .from('domains')
                .delete()
                .eq('id', domainId);

            if (deleteError) throw deleteError;

            toast.success('Domain removed successfully');
            await fetchDomains();
            return true;
        } catch (err: any) {
            setError(err.message);
            toast.error(`Failed to remove domain: ${err.message}`);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Get domain events (audit trail)
    const getDomainEvents = async (domainId: string): Promise<DomainEvent[]> => {
        try {
            const { data, error: eventsError } = await supabase
                .from('domain_events')
                .select('*')
                .eq('domain_id', domainId)
                .order('created_at', { ascending: false });

            if (eventsError) throw eventsError;

            return data || [];
        } catch (err: any) {
            toast.error(`Failed to fetch domain events: ${err.message}`);
            return [];
        }
    };

    // Auto-fetch on mount if brandId provided
    useEffect(() => {
        if (brandId) {
            fetchDomains();
        }
    }, [brandId]);

    // Set up realtime subscription for domain updates
    useEffect(() => {
        if (!brandId) return;

        const channel = supabase
            .channel(`domains:${brandId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'domains',
                    filter: `brand_id=eq.${brandId}`,
                },
                () => {
                    fetchDomains();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [brandId]);

    return {
        domains,
        loading,
        error,
        fetchDomains,
        addDomain,
        verifyDNS,
        checkSSL,
        removeDomain,
        getDomainEvents,
    };
};
