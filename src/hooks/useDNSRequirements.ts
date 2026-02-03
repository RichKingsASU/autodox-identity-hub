import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DNSRecord {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
  description?: string;
}

export interface DNSConfig {
  success: boolean;
  domain: string;
  is_apex: boolean;
  site_subdomain: string;
  load_balancer_ip: string;
  dns_records: {
    routing: DNSRecord;
    verification: DNSRecord | null;
  };
  source: "netlify_api" | "fallback";
}

// Fallback configuration when API is unavailable
const FALLBACK_DNS_CONFIG: Omit<DNSConfig, 'domain' | 'dns_records'> = {
  success: true,
  is_apex: true,
  site_subdomain: "identitybrandhub.netlify.app",
  load_balancer_ip: "75.2.60.5",
  source: "fallback",
};

export function useDNSRequirements(domain: string | null, verificationToken: string | null) {
  const [dnsConfig, setDnsConfig] = useState<DNSConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDNSRequirements = useCallback(async () => {
    if (!domain) {
      setDnsConfig(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-dns-requirements", {
        body: { domain, verification_token: verificationToken },
      });

      if (fnError) {
        console.error("Error fetching DNS requirements:", fnError);
        // Use fallback on error
        setDnsConfig(createFallbackConfig(domain, verificationToken));
        setError("Using fallback DNS configuration");
      } else {
        setDnsConfig(data as DNSConfig);
      }
    } catch (err) {
      console.error("Failed to fetch DNS requirements:", err);
      // Use fallback on network error
      setDnsConfig(createFallbackConfig(domain, verificationToken));
      setError("Using fallback DNS configuration");
    } finally {
      setLoading(false);
    }
  }, [domain, verificationToken]);

  // Auto-fetch when domain or token changes
  useEffect(() => {
    if (domain) {
      fetchDNSRequirements();
    }
  }, [domain, verificationToken, fetchDNSRequirements]);

  return { dnsConfig, loading, error, fetchDNSRequirements };
}

// Helper to create fallback config based on domain
function createFallbackConfig(domain: string, verificationToken: string | null): DNSConfig {
  const isApex = isApexDomain(domain);
  
  return {
    ...FALLBACK_DNS_CONFIG,
    domain,
    is_apex: isApex,
    dns_records: {
      routing: isApex
        ? {
            type: "A",
            name: "@",
            value: FALLBACK_DNS_CONFIG.load_balancer_ip,
            description: "Points your domain to the load balancer",
          }
        : {
            type: "CNAME",
            name: getSubdomainPart(domain),
            value: FALLBACK_DNS_CONFIG.site_subdomain,
            description: `Points your subdomain to ${FALLBACK_DNS_CONFIG.site_subdomain}`,
          },
      verification: verificationToken
        ? {
            type: "TXT",
            name: "_autodox-verify",
            value: verificationToken,
            description: "Proves ownership of the domain",
          }
        : null,
    },
  };
}

// Multi-level TLD detection
const MULTI_LEVEL_TLDS = [
  'co.uk', 'org.uk', 'com.au', 'net.au', 'co.nz', 'co.jp', 'com.br',
  'co.in', 'com.cn', 'co.za', 'com.mx', 'co.kr', 'com.sg', 'com.hk',
  'co.th', 'com.my', 'co.id', 'com.tw', 'com.ph', 'com.vn', 'co.il',
  'com.pl', 'com.ar', 'com.co', 'com.pe',
];

function isApexDomain(domain: string): boolean {
  const lower = domain.toLowerCase();
  
  for (const tld of MULTI_LEVEL_TLDS) {
    if (lower.endsWith(`.${tld}`)) {
      const withoutTld = lower.slice(0, -(tld.length + 1));
      return !withoutTld.includes('.');
    }
  }
  
  return domain.split('.').length === 2;
}

function getSubdomainPart(domain: string): string {
  const lower = domain.toLowerCase();
  
  for (const tld of MULTI_LEVEL_TLDS) {
    if (lower.endsWith(`.${tld}`)) {
      const withoutTld = lower.slice(0, -(tld.length + 1));
      return withoutTld.split('.')[0];
    }
  }
  
  return domain.split('.')[0];
}
