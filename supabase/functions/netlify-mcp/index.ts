import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NETLIFY_ACCESS_TOKEN = Deno.env.get("NETLIFY_ACCESS_TOKEN");
const NETLIFY_SITE_ID = Deno.env.get("NETLIFY_SITE_ID");

// Helper function for Netlify API calls
async function netlifyFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  if (!NETLIFY_ACCESS_TOKEN || !NETLIFY_SITE_ID) {
    throw new Error("Netlify credentials not configured (NETLIFY_ACCESS_TOKEN and NETLIFY_SITE_ID required)");
  }

  const url = endpoint.startsWith("http") 
    ? endpoint 
    : `https://api.netlify.com/api/v1${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Netlify API error: ${error.message || JSON.stringify(error)}`);
  }

  return response.json();
}

// Create MCP server instance
const mcp = new McpServer({
  name: "netlify-domain-manager",
  version: "1.0.0",
});

// Tool: List all domains for the site
mcp.tool("list_domains", {
  description: "List all custom domains configured for the Netlify site",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [] as const,
  },
  handler: async () => {
    try {
      const domains = await netlifyFetch(`/sites/${NETLIFY_SITE_ID}/domains`);
      
      const formatted = domains.map((d: any) => ({
        id: d.id,
        hostname: d.hostname,
        ssl_state: d.ssl?.state || "unknown",
        verification_state: d.verification_state,
        primary: d.primary,
      }));

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ domains: formatted, count: formatted.length }, null, 2),
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  },
});

// Tool: Add a new domain
mcp.tool("add_domain", {
  description: "Add a custom domain to the Netlify site",
  inputSchema: {
    type: "object" as const,
    properties: {
      domain: {
        type: "string" as const,
        description: "The domain name to add (e.g., example.com)",
      },
    },
    required: ["domain"] as const,
  },
  handler: async (args: { domain: string }) => {
    try {
      const result = await netlifyFetch(`/sites/${NETLIFY_SITE_ID}/domains`, {
        method: "POST",
        body: JSON.stringify({ hostname: args.domain }),
      });

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            domain_id: result.id,
            hostname: result.hostname,
            ssl_state: result.ssl?.state || "pending",
            dns_records: [
              { type: "A", name: "@", value: "75.2.60.5" },
              { type: "CNAME", name: "www", value: `${NETLIFY_SITE_ID}.netlify.app` },
            ],
            message: "Domain added. Configure your DNS records as shown above.",
          }, null, 2),
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text" as const, text: `Error adding domain: ${error.message}` }],
        isError: true,
      };
    }
  },
});

// Tool: Get domain details
mcp.tool("get_domain", {
  description: "Get details for a specific domain",
  inputSchema: {
    type: "object" as const,
    properties: {
      domain: {
        type: "string" as const,
        description: "The domain name to look up",
      },
    },
    required: ["domain"] as const,
  },
  handler: async (args: { domain: string }) => {
    try {
      const result = await netlifyFetch(`/sites/${NETLIFY_SITE_ID}/domains/${args.domain}`);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            id: result.id,
            hostname: result.hostname,
            ssl: result.ssl,
            verification_state: result.verification_state,
            dns_zone_id: result.dns_zone_id,
            primary: result.primary,
          }, null, 2),
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  },
});

// Tool: Check SSL status
mcp.tool("check_ssl_status", {
  description: "Check SSL certificate status for the site",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [] as const,
  },
  handler: async () => {
    try {
      const ssl = await netlifyFetch(`/sites/${NETLIFY_SITE_ID}/ssl`);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            state: ssl.state,
            domains: ssl.domains?.map((d: any) => ({
              domain: d.domain,
              state: d.state,
            })),
            expires_at: ssl.expires_at,
          }, null, 2),
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  },
});

// Tool: Provision SSL certificate
mcp.tool("provision_ssl", {
  description: "Provision or renew SSL certificate for the site",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [] as const,
  },
  handler: async () => {
    try {
      const result = await netlifyFetch(`/sites/${NETLIFY_SITE_ID}/ssl`, {
        method: "POST",
      });

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            state: result.state,
            message: "SSL provisioning initiated",
          }, null, 2),
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  },
});

// Tool: Remove domain
mcp.tool("remove_domain", {
  description: "Remove a custom domain from the Netlify site",
  inputSchema: {
    type: "object" as const,
    properties: {
      domain: {
        type: "string" as const,
        description: "The domain name to remove",
      },
    },
    required: ["domain"] as const,
  },
  handler: async (args: { domain: string }) => {
    try {
      await netlifyFetch(`/sites/${NETLIFY_SITE_ID}/domains/${args.domain}`, {
        method: "DELETE",
      });

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            message: `Domain ${args.domain} removed successfully`,
          }, null, 2),
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  },
});

// Tool: Get site info
mcp.tool("get_site_info", {
  description: "Get Netlify site information",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [] as const,
  },
  handler: async () => {
    try {
      const site = await netlifyFetch(`/sites/${NETLIFY_SITE_ID}`);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            id: site.id,
            name: site.name,
            url: site.url,
            ssl_url: site.ssl_url,
            admin_url: site.admin_url,
            custom_domain: site.custom_domain,
            domain_aliases: site.domain_aliases,
            published_deploy: site.published_deploy?.id,
          }, null, 2),
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  },
});

// Bind to HTTP transport
const transport = new StreamableHttpTransport();
const httpHandler = transport.bind(mcp);

// Root handler - matches the function name
const app = new Hono();

// MCP protocol handler
const mcpApp = new Hono();

mcpApp.get("/", (c) => {
  return c.json({
    name: "netlify-domain-manager",
    version: "1.0.0",
    description: "MCP server for Netlify domain management",
    tools: [
      "list_domains",
      "add_domain", 
      "get_domain",
      "check_ssl_status",
      "provision_ssl",
      "remove_domain",
      "get_site_info",
    ],
    endpoints: {
      mcp: "/mcp",
      health: "/health",
    },
  }, { headers: corsHeaders });
});

mcpApp.get("/health", (c) => {
  return c.json({ 
    status: "ok",
    configured: !!(NETLIFY_ACCESS_TOKEN && NETLIFY_SITE_ID),
  }, { headers: corsHeaders });
});

mcpApp.all("/mcp", async (c) => {
  const response = await httpHandler(c.req.raw);
  return response;
});

mcpApp.options("/*", (c) => {
  return c.text("ok", { headers: corsHeaders });
});

// Mount at /netlify-mcp (the function name)
app.route("/netlify-mcp", mcpApp);

Deno.serve(app.fetch);
