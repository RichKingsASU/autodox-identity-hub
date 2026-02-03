import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_REF) {
  console.error("SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF environment variables are required.");
  process.exit(1);
}

const server = new Server(
  {
    name: "supabase-mgmt-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "configure_smtp",
        description: "Configure SMTP settings for a Supabase project",
        inputSchema: {
          type: "object",
          properties: {
            smtp_host: { type: "string" },
            smtp_port: { type: "number" },
            smtp_user: { type: "string" },
            smtp_pass: { type: "string" },
            smtp_sender_name: { type: "string" },
            smtp_admin_email: { type: "string" },
          },
          required: ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_sender_name", "smtp_admin_email"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "configure_smtp") {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_sender_name, smtp_admin_email } = request.params.arguments;

    try {
      const response = await fetch(
        `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            smtp_enabled: true,
            smtp_host,
            smtp_port,
            smtp_user,
            smtp_pass,
            smtp_sender_name,
            smtp_admin_email,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          content: [{ type: "text", text: `Error updating SMTP settings: ${JSON.stringify(error)}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: "Successfully updated Supabase SMTP settings." }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Failed to call Supabase API: ${error.message}` }],
        isError: true,
      };
    }
  }

  throw new Error("Tool not found");
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Supabase Management MCP server running on stdio");
