const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheckResponse {
  connected: boolean;
  reason?: string;
  siteName?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const netlifyToken = Deno.env.get("NETLIFY_ACCESS_TOKEN");
    const netlifySiteId = Deno.env.get("NETLIFY_SITE_ID");

    // Check for required environment variables
    if (!netlifyToken) {
      const response: HealthCheckResponse = {
        connected: false,
        reason: "missing_token",
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!netlifySiteId) {
      const response: HealthCheckResponse = {
        connected: false,
        reason: "missing_site_id",
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Test API connectivity by fetching site info
    const netlifyResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${netlifySiteId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (netlifyResponse.ok) {
      const siteData = await netlifyResponse.json();
      const response: HealthCheckResponse = {
        connected: true,
        siteName: siteData.name,
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (netlifyResponse.status === 401 || netlifyResponse.status === 403) {
      const response: HealthCheckResponse = {
        connected: false,
        reason: "invalid_credentials",
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Other API errors
    const response: HealthCheckResponse = {
      connected: false,
      reason: "api_error",
    };
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Health check error:", error);
    const response: HealthCheckResponse = {
      connected: false,
      reason: "api_error",
    };
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
