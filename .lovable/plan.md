
# Fix Netlify Connection Status Detection

## Problem Identified
The `NetlifyConnectionStatus` component uses flawed logic to detect Netlify connectivity:

1. **Current behavior**: Calls `check-domain-status` edge function with a dummy brandId
2. **Issue**: The edge function requires authentication (returns 401 if not logged in)
3. **Bug**: The logic checks if error contains "Netlify" - but auth errors don't contain "Netlify", causing false positives

```text
Current Logic Flow:
┌─────────────────────┐
│ Call edge function  │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐     ┌──────────────────────┐
│ Error contains      │ NO  │ Show "Connected" ✗   │
│ "Netlify"?          │────▶│ (Even if auth error!)│
└──────────┬──────────┘     └──────────────────────┘
           │ YES
           v
┌──────────────────────┐
│ Show "Not Connected" │
└──────────────────────┘
```

## Solution: Dedicated Health Check Endpoint

Create a new edge function specifically for checking Netlify connectivity that:
- Does NOT require authentication
- Only checks if `NETLIFY_ACCESS_TOKEN` and `NETLIFY_SITE_ID` secrets are configured
- Makes a simple API call to verify credentials work
- Returns clear connected/not-connected status

## Implementation Plan

### 1. Create `netlify-health-check` Edge Function
A new edge function at `supabase/functions/netlify-health-check/index.ts` that:
- Checks for presence of `NETLIFY_ACCESS_TOKEN` and `NETLIFY_SITE_ID` environment variables
- Makes a test API call to `https://api.netlify.com/api/v1/sites/{SITE_ID}` to verify credentials
- Returns `{ connected: true }` or `{ connected: false, reason: "..." }`
- Does NOT require JWT verification (public health endpoint)

### 2. Update `NetlifyConnectionStatus` Component
Modify `src/components/admin/NetlifyConnectionStatus.tsx` to:
- Call the new `netlify-health-check` endpoint instead of `check-domain-status`
- Use explicit `connected` boolean from response
- Handle errors gracefully with appropriate messaging

### 3. Configuration
Add the new function to `supabase/config.toml` with `verify_jwt = false`

---

## Technical Details

### New Edge Function Structure
```
supabase/functions/netlify-health-check/
└── index.ts
```

**Logic:**
1. Check if `NETLIFY_ACCESS_TOKEN` exists → if not, return `{ connected: false, reason: "missing_token" }`
2. Check if `NETLIFY_SITE_ID` exists → if not, return `{ connected: false, reason: "missing_site_id" }`
3. Call Netlify API: `GET /api/v1/sites/{SITE_ID}`
4. If 200 OK → return `{ connected: true, siteName: response.name }`
5. If 401/403 → return `{ connected: false, reason: "invalid_credentials" }`
6. If error → return `{ connected: false, reason: "api_error" }`

### Component Update
Replace the inference-based logic with direct response handling:
```typescript
const response = await supabase.functions.invoke('netlify-health-check');
setStatus({
  connected: response.data?.connected ?? false,
  checking: false,
  error: response.data?.reason
});
```

## Files to Create/Modify
1. **Create**: `supabase/functions/netlify-health-check/index.ts`
2. **Modify**: `supabase/config.toml` (add function config)
3. **Modify**: `src/components/admin/NetlifyConnectionStatus.tsx` (update logic)

## Expected Outcome
After implementation:
- Navigate to `/admin/domains`
- See **"✅ Netlify Connected"** status (since secrets are now configured)
- Connection check works regardless of user authentication state
