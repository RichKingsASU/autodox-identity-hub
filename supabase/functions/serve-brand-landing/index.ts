import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrandConfig {
  id: string;
  name: string;
  slug: string;
  domain: string;
  settings: Record<string, unknown>;
  template: {
    id: string;
    name: string;
    base_layout: string;
    default_copy: Record<string, unknown>;
    default_theme_overrides: Record<string, unknown>;
    sections_enabled: Record<string, boolean>;
  } | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract domain from Host header or query param
    const url = new URL(req.url);
    const hostHeader = req.headers.get("host") || "";
    const domain = url.searchParams.get("domain") || hostHeader;

    if (!domain) {
      return new Response(
        JSON.stringify({ error: "No domain specified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean domain (remove port if present)
    const cleanDomain = domain.split(":")[0].toLowerCase();

    console.log(`Serving brand landing for domain: ${cleanDomain}`);

    // Fetch brand by domain using the new RPC function
    const { data: routeData, error: routeError } = await supabase
      .rpc('get_brand_by_domain', { hostname: cleanDomain })
      .single();

    if (routeError || !routeData) {
      console.log(`Brand not found for domain: ${cleanDomain}`, routeError);
      return new Response(
        JSON.stringify({
          error: "Brand not found or not active",
          domain: cleanDomain
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Type assertion for RPC result
    const brandRouteData = routeData as { brand_id: string };

    // Fetch full brand and template details since RPC only returns core fields
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select(`
        id,
        name,
        slug,
        domain,
        settings,
        active_template_id,
        landing_templates (
          id,
          name,
          base_layout,
          default_copy,
          default_theme_overrides,
          sections_enabled
        )
      `)
      .eq("id", brandRouteData.brand_id)
      .single();

    if (brandError || !brand) {
      console.error(`Failed to fetch full brand details for ID: ${brandRouteData.brand_id}`, brandError);
      throw new Error("Failed to fetch brand details");
    }

    // Build brand configuration response
    const brandConfig: BrandConfig = {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      domain: brand.domain,
      settings: (brand.settings as Record<string, unknown>) || {},
      template: brand.landing_templates ? {
        id: (brand.landing_templates as any).id,
        name: (brand.landing_templates as any).name,
        base_layout: (brand.landing_templates as any).base_layout,
        default_copy: (brand.landing_templates as any).default_copy,
        default_theme_overrides: (brand.landing_templates as any).default_theme_overrides,
        sections_enabled: (brand.landing_templates as any).sections_enabled,
      } : null,
    };

    // For now, return JSON config. In production, this could:
    // 1. Render full HTML using template
    // 2. Redirect to a pre-built static page
    // 3. Return config for client-side rendering
    return new Response(
      JSON.stringify({
        success: true,
        brand: brandConfig,
        // Include rendering hints
        renderMode: "client", // or "server" for SSR
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60", // Cache for 1 minute
        }
      }
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
