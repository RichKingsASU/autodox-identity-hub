import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NETLIFY_ACCESS_TOKEN = Deno.env.get("NETLIFY_ACCESS_TOKEN");
const NETLIFY_SITE_ID = Deno.env.get("NETLIFY_SITE_ID");

// Fallback values if Netlify API is unavailable
const FALLBACK_CONFIG = {
  load_balancer_ip: "75.2.60.5",
  site_subdomain: "identitybrandhub.netlify.app",
  verification_prefix: "_autodox-verify",
};

// Known multi-level TLDs
const MULTI_LEVEL_TLDS = [
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au',
  'co.nz', 'org.nz', 'co.jp', 'ne.jp', 'com.br', 'org.br', 'co.in',
  'net.in', 'com.cn', 'net.cn', 'co.za', 'org.za', 'com.mx', 'org.mx',
  'co.kr', 'or.kr', 'com.sg', 'net.sg', 'com.hk', 'net.hk', 'co.th',
  'or.th', 'com.my', 'net.my', 'co.id', 'or.id', 'com.tw', 'net.tw',
  'com.ph', 'net.ph', 'com.vn', 'net.vn', 'co.il', 'org.il', 'com.pl',
  'net.pl', 'com.ar', 'net.ar', 'com.co', 'net.co', 'com.pe', 'net.pe',
];

function isApexDomain(domain: string): boolean {
  const lower = domain.toLowerCase();
  
  for (const tld of MULTI_LEVEL_TLDS) {
    if (lower.endsWith(`.${tld}`)) {
      const withoutTld = lower.slice(0, -(tld.length + 1));
      return !withoutTld.includes('.');
    }
  }
  
  const parts = domain.split('.');
  return parts.length === 2;
}

function getSubdomainPart(domain: string): string {
  const lower = domain.toLowerCase();
  
  for (const tld of MULTI_LEVEL_TLDS) {
    if (lower.endsWith(`.${tld}`)) {
      const withoutTld = lower.slice(0, -(tld.length + 1));
      const parts = withoutTld.split('.');
      return parts[0];
    }
  }
  
  const parts = domain.split('.');
  return parts[0];
}

async function fetchNetlifySiteInfo(): Promise<{ name: string; ssl_url: string } | null> {
  if (!NETLIFY_ACCESS_TOKEN || !NETLIFY_SITE_ID) {
    console.log("Netlify credentials not configured, using fallback");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}`,
      {
        headers: {
          Authorization: `Bearer ${NETLIFY_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Netlify API error:", response.status);
      return null;
    }

    const site = await response.json();
    return {
      name: site.name,
      ssl_url: site.ssl_url || `https://${site.name}.netlify.app`,
    };
  } catch (error) {
    console.error("Failed to fetch Netlify site info:", error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, verification_token } = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ error: "Domain is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch site info from Netlify API
    const siteInfo = await fetchNetlifySiteInfo();
    
    const siteName = siteInfo?.name || FALLBACK_CONFIG.site_subdomain.split('.')[0];
    const siteSubdomain = siteInfo ? `${siteInfo.name}.netlify.app` : FALLBACK_CONFIG.site_subdomain;
    const loadBalancerIP = FALLBACK_CONFIG.load_balancer_ip; // Netlify's standard LB IP

    const isApex = isApexDomain(domain);

    const dnsRecords = {
      routing: isApex
        ? {
            type: "A",
            name: "@",
            value: loadBalancerIP,
            description: "Points your domain to Netlify's load balancer",
          }
        : {
            type: "CNAME",
            name: getSubdomainPart(domain),
            value: siteSubdomain,
            description: `Points your subdomain to ${siteSubdomain}`,
          },
      verification: verification_token
        ? {
            type: "TXT",
            name: FALLBACK_CONFIG.verification_prefix,
            value: verification_token,
            description: "Proves ownership of the domain",
          }
        : null,
    };

    const response = {
      success: true,
      domain,
      is_apex: isApex,
      site_subdomain: siteSubdomain,
      load_balancer_ip: loadBalancerIP,
      dns_records: dnsRecords,
      source: siteInfo ? "netlify_api" : "fallback",
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in get-dns-requirements:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
