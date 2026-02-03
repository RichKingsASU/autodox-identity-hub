import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DomainStatus } from './useBrandDomain';

export interface DomainWithBrand {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  domain_status: DomainStatus | null;
  domain_verification_token: string | null;
  domain_verified_at: string | null;
  ssl_status: string | null;
  domain_error: string | null;
  cloudflare_hostname_id: string | null;
}

export function useDomainManager() {
  const [brands, setBrands] = useState<DomainWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('brands')
        .select('id, name, slug, domain, domain_status, domain_verification_token, domain_verified_at, ssl_status, domain_error, cloudflare_hostname_id')
        .order('name');

      if (fetchError) throw fetchError;

      setBrands((data || []) as DomainWithBrand[]);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch brands:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh for pending domains
  useEffect(() => {
    const hasPendingDomains = brands.some(
      b => b.domain && ['pending', 'verifying', 'provisioning_ssl'].includes(b.domain_status || '')
    );

    if (hasPendingDomains) {
      // Poll every 30 seconds for pending domains
      pollIntervalRef.current = window.setInterval(() => {
        fetchBrands();
      }, 30000);
    } else if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [brands, fetchBrands]);

  const verifyDomain = async (brandId: string): Promise<boolean> => {
    // Optimistic update
    setBrands(prev => prev.map(b => 
      b.id === brandId ? { ...b, domain_status: 'verifying' as DomainStatus } : b
    ));

    try {
      const response = await supabase.functions.invoke('verify-domain', {
        body: { brandId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (result.verified) {
        toast.success('Domain verified successfully!');
        // Auto-trigger SSL provisioning
        await provisionSSL(brandId);
        await fetchBrands();
        return true;
      } else {
        // Revert optimistic update
        await fetchBrands();
        toast.error(result.message || 'Domain verification failed');
        return false;
      }
    } catch (err: any) {
      await fetchBrands();
      toast.error(`Verification failed: ${err.message}`);
      return false;
    }
  };

  const provisionSSL = async (brandId: string): Promise<boolean> => {
    try {
      const response = await supabase.functions.invoke('add-domain-to-netlify', {
        body: { brand_id: brandId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (result.success) {
        toast.success('SSL provisioning started');
        await fetchBrands();
        return true;
      } else {
        toast.error(result.error || 'SSL provisioning failed');
        return false;
      }
    } catch (err: any) {
      toast.error(`SSL provisioning failed: ${err.message}`);
      return false;
    }
  };

  const checkStatus = async (brandId: string): Promise<boolean> => {
    try {
      const response = await supabase.functions.invoke('check-domain-status', {
        body: { brandId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      await fetchBrands();
      toast.success('Status updated');
      return true;
    } catch (err: any) {
      toast.error(`Status check failed: ${err.message}`);
      return false;
    }
  };

  const removeDomain = async (brandId: string): Promise<boolean> => {
    // Optimistic update
    const previousBrands = [...brands];
    setBrands(prev => prev.map(b => 
      b.id === brandId ? { 
        ...b, 
        domain: null, 
        domain_status: null, 
        domain_verification_token: null,
        ssl_status: null,
        domain_error: null,
      } : b
    ));

    try {
      const { error } = await supabase
        .from('brands')
        .update({
          domain: null,
          domain_status: null,
          domain_verification_token: null,
          domain_verified_at: null,
          ssl_status: null,
          domain_error: null,
          cloudflare_hostname_id: null,
        })
        .eq('id', brandId);

      if (error) throw error;

      toast.success('Domain removed');
      return true;
    } catch (err: any) {
      // Revert optimistic update
      setBrands(previousBrands);
      toast.error(`Failed to remove domain: ${err.message}`);
      return false;
    }
  };

  // Get brands with configured domains
  const brandsWithDomains = brands.filter(b => b.domain);
  
  // Get brands without domains
  const brandsWithoutDomains = brands.filter(b => !b.domain);

  // Statistics
  const stats = {
    total: brands.length,
    withDomains: brandsWithDomains.length,
    active: brands.filter(b => b.domain_status === 'active').length,
    pending: brands.filter(b => b.domain && ['pending', 'verifying', 'provisioning_ssl'].includes(b.domain_status || '')).length,
    failed: brands.filter(b => b.domain_status === 'failed').length,
  };

  return {
    brands,
    brandsWithDomains,
    brandsWithoutDomains,
    stats,
    loading,
    error,
    fetchBrands,
    verifyDomain,
    provisionSSL,
    checkStatus,
    removeDomain,
  };
}
