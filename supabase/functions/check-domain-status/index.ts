import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckDomainStatusRequest {
  brandId: string;
}

interface NetlifyDomainResponse {
  id: string;
  hostname: string;
  ssl?: {
    state: string;
  };
  verification_state?: string;
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
    const netlifyToken = Deno.env.get("NETLIFY_ACCESS_TOKEN");
    const netlifySiteId = Deno.env.get("NETLIFY_SITE_ID");

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

    // If no Netlify domain ID, just return current status
    if (!brand.cloudflare_hostname_id || !netlifyToken || !netlifySiteId) {
      return new Response(
        JSON.stringify({
          status: brand.domain_status,
          sslStatus: brand.ssl_status,
          domain: brand.domain,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check status with Netlify
    const netlifyUrl = `https://api.netlify.com/api/v1/sites/${netlifySiteId}/domains/${brand.domain}`;
    
    const response = await fetch(netlifyUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${netlifyToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          status: brand.domain_status,
          sslStatus: brand.ssl_status,
          error: "Failed to check domain status with Netlify",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: NetlifyDomainResponse = await response.json();

    // Update local status based on Netlify response
    const sslStatus = data.ssl?.state || brand.ssl_status;
    let domainStatus = brand.domain_status;

    if (sslStatus === "active" || sslStatus === "issued") {
      domainStatus = "active";
    } else if (sslStatus === "pending" || sslStatus === "pending_validation") {
      domainStatus = "provisioning_ssl";
    } else if (sslStatus === "failed") {
      domainStatus = "failed";
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
        verificationState: data.verification_state,
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
