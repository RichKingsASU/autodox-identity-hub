import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RemoveDomainRequest {
  brand_id: string;
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify auth
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { brand_id }: RemoveDomainRequest = await req.json();

    if (!brand_id) {
      return new Response(
        JSON.stringify({ error: "brand_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch brand domain info
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("domain, cloudflare_hostname_id")
      .eq("id", brand_id)
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ error: "Brand not found", details: brandError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!brand.domain) {
      return new Response(
        JSON.stringify({ success: true, message: "No domain to remove" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const netlifyToken = Deno.env.get("NETLIFY_ACCESS_TOKEN");
    const netlifySiteId = Deno.env.get("NETLIFY_SITE_ID");

    let netlifyRemoved = false;
    let netlifyError: string | null = null;

    // Try to remove from Netlify if credentials are available
    if (netlifyToken && netlifySiteId) {
      try {
        const deleteResponse = await fetch(
          `https://api.netlify.com/api/v1/sites/${netlifySiteId}/domains/${brand.domain}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${netlifyToken}`,
            },
          }
        );

        if (deleteResponse.ok || deleteResponse.status === 404) {
          // 404 means domain wasn't in Netlify (already removed or never added)
          netlifyRemoved = true;
          console.log(`Domain ${brand.domain} removed from Netlify (status: ${deleteResponse.status})`);
        } else {
          const errorText = await deleteResponse.text();
          netlifyError = `Netlify API error: ${deleteResponse.status} - ${errorText}`;
          console.error(netlifyError);
        }
      } catch (e) {
        netlifyError = `Failed to call Netlify API: ${e instanceof Error ? e.message : String(e)}`;
        console.error(netlifyError);
      }
    } else {
      console.log("Netlify credentials not configured, skipping Netlify cleanup");
      netlifyRemoved = true; // Proceed with DB cleanup anyway
    }

    // Clear database fields regardless (user wants to remove)
    const { error: updateError } = await supabase
      .from("brands")
      .update({
        domain: null,
        domain_status: null,
        domain_verification_token: null,
        domain_verified_at: null,
        ssl_status: null,
        domain_error: null,
        cloudflare_hostname_id: null,
      })
      .eq("id", brand_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ 
          error: "Failed to clear domain from database", 
          details: updateError.message,
          netlify_removed: netlifyRemoved 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        domain_removed: brand.domain,
        netlify_removed: netlifyRemoved,
        netlify_error: netlifyError,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("remove-domain-from-netlify error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
