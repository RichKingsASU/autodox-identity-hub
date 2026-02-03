#!/bin/bash
# Helper script to run Netlify MCP server locally
# Replace YOUR_NETLIFY_AUTH_TOKEN_HERE with your actual token
export NETLIFY_AUTH_TOKEN="YOUR_NETLIFY_AUTH_TOKEN_HERE"
npx -y @netlify/mcp-server
