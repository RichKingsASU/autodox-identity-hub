import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DomainStatus = 'pending' | 'verifying' | 'verified' | 'provisioning_ssl' | 'active' | 'failed';

export interface BrandDomainState {
  domain: string | null;
  domain_status: DomainStatus | null;
  domain_verification_token: string | null;
  domain_verified_at: string | null;
  ssl_status: string | null;
  domain_error: string | null;
  cloudflare_hostname_id: string | null;
}

// Reserved domains that cannot be configured
const RESERVED_DOMAINS = [
  'lovable.app',
  'lovable.dev',
  'netlify.app',
  'netlify.com',
  'supabase.co',
  'supabase.com',
  'autodox.netlify.app',
  'agents-institute.com',
  'vercel.app',
  'herokuapp.com',
  'cloudflare.com',
];

function generateVerificationToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'adx_';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function isReservedDomain(domainName: string): boolean {
  const lower = domainName.toLowerCase();
  return RESERVED_DOMAINS.some(
    reserved => lower === reserved || lower.endsWith(`.${reserved}`)
  );
}

export function useBrandDomain(brandId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [domainState, setDomainState] = useState<BrandDomainState | null>(null);
  const [lastVerifyAttempt, setLastVerifyAttempt] = useState<Date | null>(null);

  const VERIFY_COOLDOWN_MS = 30000; // 30 seconds

  const fetchDomainState = useCallback(async () => {
    if (!brandId) return null;
    
    const { data, error } = await supabase
      .from('brands')
      .select('domain, domain_status, domain_verification_token, domain_verified_at, ssl_status, domain_error, cloudflare_hostname_id')
      .eq('id', brandId)
      .single();

    if (error) {
      console.error('Failed to fetch domain state:', error);
      return null;
    }

    setDomainState(data as BrandDomainState);
    return data as BrandDomainState;
  }, [brandId]);

  const setDomain = async (domainName: string): Promise<boolean> => {
    if (!brandId) return false;
    
    // Trim whitespace to prevent bypassing uniqueness checks
    const trimmedDomain = domainName.trim();
    
    if (!trimmedDomain) {
      toast.error('Domain cannot be empty');
      return false;
    }
    
    setLoading(true);
    
    // Validate domain format
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(trimmedDomain)) {
      toast.error('Invalid domain format');
      setLoading(false);
      return false;
    }

    const normalizedDomain = trimmedDomain.toLowerCase();

    // Check for reserved domains
    if (isReservedDomain(normalizedDomain)) {
      toast.error('This domain is reserved and cannot be used');
      setLoading(false);
      return false;
    }

    // Check for duplicate domains (client-side check before hitting unique constraint)
    const { data: existingBrand, error: checkError } = await supabase
      .from('brands')
      .select('id, name')
      .eq('domain', normalizedDomain)
      .neq('id', brandId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking domain uniqueness:', checkError);
      toast.error('Failed to validate domain availability');
      setLoading(false);
      return false;
    }

    if (existingBrand) {
      toast.error(`This domain is already assigned to another brand: ${existingBrand.name}`);
      setLoading(false);
      return false;
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();

    const { error } = await supabase
      .from('brands')
      .update({
        domain: normalizedDomain,
        domain_status: 'pending',
        domain_verification_token: verificationToken,
        domain_verified_at: null,
        ssl_status: null,
        domain_error: null,
        cloudflare_hostname_id: null,
      })
      .eq('id', brandId);

    setLoading(false);

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        toast.error('This domain is already in use by another brand');
      } else {
        toast.error(`Failed to set domain: ${error.message}`);
      }
      return false;
    }

    toast.success('Domain configured. Please add the DNS records to verify ownership.');
    await fetchDomainState();
    return true;
  };

  const canVerify = useCallback(() => {
    if (!lastVerifyAttempt) return true;
    return (Date.now() - lastVerifyAttempt.getTime()) > VERIFY_COOLDOWN_MS;
  }, [lastVerifyAttempt]);

  const getCooldownRemaining = useCallback(() => {
    if (!lastVerifyAttempt) return 0;
    const elapsed = Date.now() - lastVerifyAttempt.getTime();
    return Math.max(0, Math.ceil((VERIFY_COOLDOWN_MS - elapsed) / 1000));
  }, [lastVerifyAttempt]);

  const verifyDomain = async (): Promise<boolean> => {
    if (!brandId) return false;

    // Rate limiting check
    if (!canVerify()) {
      const remaining = getCooldownRemaining();
      toast.error(`Please wait ${remaining} seconds before verifying again`);
      return false;
    }
    
    setLoading(true);
    setLastVerifyAttempt(new Date());

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to verify domain');
        setLoading(false);
        return false;
      }

      const response = await supabase.functions.invoke('verify-domain', {
        body: { brandId },
      });

      if (response.error) {
        toast.error(`Verification failed: ${response.error.message}`);
        setLoading(false);
        return false;
      }

      const result = response.data;
      
      if (result.verified) {
        toast.success('Domain verified successfully!');
        await fetchDomainState();
        setLoading(false);
        return true;
      } else {
        toast.error(result.message || 'Domain verification failed');
        await fetchDomainState();
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Verify domain error:', error);
      toast.error('Failed to verify domain');
      setLoading(false);
      return false;
    }
  };

  const provisionSSL = async (): Promise<boolean> => {
    if (!brandId) return false;
    
    setLoading(true);

    try {
      const response = await supabase.functions.invoke('add-domain-to-netlify', {
        body: { brand_id: brandId },
      });

      if (response.error) {
        toast.error(`SSL provisioning failed: ${response.error.message}`);
        setLoading(false);
        return false;
      }

      const result = response.data;
      
      if (result.success) {
        toast.success('SSL provisioning started');
        await fetchDomainState();
        setLoading(false);
        return true;
      } else {
        toast.error(result.error || 'SSL provisioning failed');
        await fetchDomainState();
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Provision SSL error:', error);
      toast.error('Failed to provision SSL');
      setLoading(false);
      return false;
    }
  };

  const checkStatus = async (): Promise<boolean> => {
    if (!brandId) return false;
    
    setLoading(true);

    try {
      const response = await supabase.functions.invoke('check-domain-status', {
        body: { brandId },
      });

      if (response.error) {
        toast.error(`Status check failed: ${response.error.message}`);
        setLoading(false);
        return false;
      }

      await fetchDomainState();
      toast.success('Status updated');
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Check status error:', error);
      toast.error('Failed to check status');
      setLoading(false);
      return false;
    }
  };

  const removeDomain = async (): Promise<boolean> => {
    if (!brandId) return false;
    
    setLoading(true);

    try {
      // Call edge function to remove from Netlify and clear database
      const response = await supabase.functions.invoke('remove-domain-from-netlify', {
        body: { brand_id: brandId },
      });

      if (response.error) {
        toast.error(`Failed to remove domain: ${response.error.message}`);
        setLoading(false);
        return false;
      }

      const result = response.data;

      if (result.success) {
        if (result.netlify_error) {
          // Domain removed from DB but Netlify had issues
          toast.warning(`Domain removed, but Netlify cleanup had issues: ${result.netlify_error}`);
        } else {
          toast.success('Domain removed successfully');
        }
        setDomainState(null);
        setLoading(false);
        return true;
      } else {
        toast.error(result.error || 'Failed to remove domain');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Remove domain error:', error);
      toast.error('Failed to remove domain');
      setLoading(false);
      return false;
    }
  };

  return {
    loading,
    domainState,
    fetchDomainState,
    setDomain,
    verifyDomain,
    provisionSSL,
    checkStatus,
    removeDomain,
    canVerify,
    getCooldownRemaining,
    lastVerifyAttempt,
  };
}
