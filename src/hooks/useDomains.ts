import { useState } from 'react';
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

/**
 * Note: Domain management is handled through the brands table.
 * This hook provides a stub interface for future dedicated domains table implementation.
 */
export const useDomains = (_brandId?: string) => {
  const [domains] = useState<Domain[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const fetchDomains = async (_targetBrandId?: string) => {
    toast.info('Domain management is handled through the brand settings');
  };

  const addDomain = async (_targetBrandId: string, _domainName: string, _isPrimary: boolean = false): Promise<Domain | null> => {
    toast.info('Use brand settings to manage domains');
    return null;
  };

  const verifyDNS = async (_domainId: string): Promise<boolean> => {
    toast.info('Use brand settings to verify DNS');
    return false;
  };

  const checkSSL = async (_domainId: string): Promise<boolean> => {
    toast.info('Use brand settings to check SSL status');
    return false;
  };

  const removeDomain = async (_domainId: string): Promise<boolean> => {
    toast.info('Use brand settings to manage domains');
    return false;
  };

  const getDomainEvents = async (_domainId: string): Promise<DomainEvent[]> => {
    return [];
  };

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
