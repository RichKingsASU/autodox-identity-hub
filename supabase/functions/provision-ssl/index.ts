import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProvisionSSLRequest {
  brandId: string;
}

interface CloudflareHostnameResponse {
  success: boolean;
  result?: {
    id: string;
    hostname: string;
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
    const cloudflareFallbackOrigin = Deno.env.get("CLOUDFLARE_FALLBACK_ORIGIN");

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

    const { brandId }: ProvisionSSLRequest = await req.json();

    if (!brandId) {
      return new Response(
        JSON.stringify({ error: "Brand ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if Cloudflare is configured
    if (!cloudflareApiToken || !cloudflareZoneId) {
      // For now, simulate SSL provisioning if Cloudflare is not configured
      console.log("Cloudflare not configured, simulating SSL provisioning");
      
      await supabase
        .from("brands")
        .update({
          domain_status: "provisioning_ssl",
          ssl_status: "pending_validation",
        })
        .eq("id", brandId);

      // Simulate async SSL provisioning
      setTimeout(async () => {
        const serviceClient = createClient(
          supabaseUrl,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        
        await serviceClient
          .from("brands")
          .update({
            domain_status: "active",
            ssl_status: "active",
          })
          .eq("id", brandId);
      }, 5000);

      return new Response(
        JSON.stringify({
          success: true,
          message: "SSL provisioning started (simulated - Cloudflare not configured)",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch brand details
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, domain, domain_status")
      .eq("id", brandId)
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ error: "Brand not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (brand.domain_status !== "verified") {
      return new Response(
        JSON.stringify({ error: "Domain must be verified before provisioning SSL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to provisioning
    await supabase
      .from("brands")
      .update({ 
        domain_status: "provisioning_ssl",
        ssl_status: "initializing",
      })
      .eq("id", brandId);

    // Create custom hostname in Cloudflare
    const cloudflareUrl = `https://api.cloudflare.com/client/v4/zones/${cloudflareZoneId}/custom_hostnames`;
    
    const response = await fetch(cloudflareUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cloudflareApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hostname: brand.domain,
        ssl: {
          method: "http",
          type: "dv",
          settings: {
            http2: "on",
            min_tls_version: "1.2",
          },
        },
        custom_origin_server: cloudflareFallbackOrigin,
      }),
    });

    const data: CloudflareHostnameResponse = await response.json();

    if (!data.success || !data.result) {
      const errorMessage = data.errors?.[0]?.message || "Failed to create custom hostname";
      
      await supabase
        .from("brands")
        .update({
          domain_status: "failed",
          domain_error: errorMessage,
          ssl_status: "failed",
        })
        .eq("id", brandId);

      return new Response(
        JSON.stringify({ success: false, message: errorMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store Cloudflare hostname ID and update status
    await supabase
      .from("brands")
      .update({
        cloudflare_hostname_id: data.result.id,
        ssl_status: data.result.ssl.status,
      })
      .eq("id", brandId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "SSL provisioning started",
        hostnameId: data.result.id,
        sslStatus: data.result.ssl.status,
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
