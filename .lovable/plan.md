
# Fix Confirmation Emails Not Sending After Signup

## Root Cause

The `send-signup-verification` edge function has incomplete CORS headers. When the browser makes a preflight OPTIONS request, the function doesn't allow all the headers that the Supabase JS client sends, causing the actual POST request to be blocked.

## Evidence

1. Edge function works when called directly via curl (I tested it - returned status 200)
2. No logs appear for the function during normal signup (preflight fails before function executes)
3. No debug_logs errors (the function is never actually invoked)
4. Email logs show the test email I sent via curl, but no verification emails from the app

## Solution

Update the CORS headers in `send-signup-verification/index.ts` to include all Supabase client headers:

### File: `supabase/functions/send-signup-verification/index.ts`

**Change lines 6-10 from:**
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
```

**To:**
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

## Why This Fixes It

| Before | After |
|--------|-------|
| Preflight request fails due to missing header permissions | All Supabase client headers are permitted |
| POST request never executes | POST request succeeds |
| Try/catch silently swallows the CORS error | Function executes and sends email via Resend |

## Testing

After deployment:
1. Sign out completely
2. Click "Sign Up" and create a new account with a fresh email
3. Check inbox for the branded verification email from Autodox
4. Check `email_logs` table to confirm the email was logged
