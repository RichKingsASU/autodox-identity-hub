import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckDomainStatusRequest {
  brandId: string;
}

interface CloudflareHostnameResponse {
  success: boolean;
  result?: {
    id: string;
    hostname: string;
    status: string;
    ssl: {
      status: string;
    };
  };
  errors?: Array<{ message: string }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const cloudflareApiToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
    const cloudflareZoneId = Deno.env.get("CLOUDFLARE_ZONE_ID");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate user
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { brandId }: CheckDomainStatusRequest = await req.json();

    if (!brandId) {
      return new Response(
        JSON.stringify({ error: "Brand ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch brand details
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, domain, domain_status, cloudflare_hostname_id, ssl_status")
      .eq("id", brandId)
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ error: "Brand not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no Cloudflare hostname ID, just return current status
    if (!brand.cloudflare_hostname_id || !cloudflareApiToken || !cloudflareZoneId) {
      return new Response(
        JSON.stringify({
          status: brand.domain_status,
          sslStatus: brand.ssl_status,
          domain: brand.domain,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check status with Cloudflare
    const cloudflareUrl = `https://api.cloudflare.com/client/v4/zones/${cloudflareZoneId}/custom_hostnames/${brand.cloudflare_hostname_id}`;
    
    const response = await fetch(cloudflareUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${cloudflareApiToken}`,
        "Content-Type": "application/json",
      },
    });

    const data: CloudflareHostnameResponse = await response.json();

    if (!data.success || !data.result) {
      return new Response(
        JSON.stringify({
          status: brand.domain_status,
          sslStatus: brand.ssl_status,
          error: data.errors?.[0]?.message || "Failed to check hostname status",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update local status based on Cloudflare response
    const sslStatus = data.result.ssl.status;
    let domainStatus = brand.domain_status;

    if (sslStatus === "active") {
      domainStatus = "active";
    } else if (sslStatus === "pending_validation" || sslStatus === "pending_issuance") {
      domainStatus = "provisioning_ssl";
    } else if (sslStatus === "pending_deployment") {
      domainStatus = "provisioning_ssl";
    }

    // Update database if status changed
    if (domainStatus !== brand.domain_status || sslStatus !== brand.ssl_status) {
      await supabase
        .from("brands")
        .update({
          domain_status: domainStatus,
          ssl_status: sslStatus,
        })
        .eq("id", brandId);
    }

    return new Response(
      JSON.stringify({
        status: domainStatus,
        sslStatus: sslStatus,
        domain: brand.domain,
        hostnameStatus: data.result.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
