#!/bin/bash
# Helper script to run Supabase MCP server locally
export SUPABASE_URL="https://iqluzpzttzoaybbjvtsr.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE"
npx -y @supabase/mcp-server
