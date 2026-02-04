import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProvisionSSLRequest {
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

    // Validate user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth validation failed:", userError?.message || "No user found");
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError?.message }),
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

    // Check if Netlify is configured
    if (!netlifyToken || !netlifySiteId) {
      // In development mode without Netlify, simulate immediate success
      // NOTE: setTimeout doesn't work reliably in serverless/edge functions
      console.log("Netlify not configured, simulating SSL provisioning (dev mode)");

      // Use service role to update status directly
      const serviceClient = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || supabaseAnonKey
      );

      await serviceClient
        .from("brands")
        .update({
          domain_status: "active",
          ssl_status: "issued",
          cloudflare_hostname_id: `simulated_${Date.now()}`,
          domain_error: null,
        })
        .eq("id", brandId);

      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message: "Domain activated (simulated - Netlify not configured)",
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
        ssl_status: "pending",
      })
      .eq("id", brandId);

    // Add custom domain to Netlify site
    const netlifyUrl = `https://api.netlify.com/api/v1/sites/${netlifySiteId}/domains`;
    
    const response = await fetch(netlifyUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${netlifyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hostname: brand.domain,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || "Failed to add domain to Netlify";
      
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

    const data: NetlifyDomainResponse = await response.json();

    // Store Netlify domain ID and update status
    // Netlify auto-provisions SSL, so we track the state
    const sslState = data.ssl?.state || "pending";
    
    await supabase
      .from("brands")
      .update({
        cloudflare_hostname_id: data.id, // Reusing this field for Netlify domain ID
        ssl_status: sslState,
        domain_status: sslState === "active" ? "active" : "provisioning_ssl",
      })
      .eq("id", brandId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Domain added to Netlify, SSL provisioning started",
        domainId: data.id,
        sslStatus: sslState,
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
