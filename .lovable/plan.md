
# Plan: Route Password Reset Through Resend

## Problem Summary
Password reset uses Supabase's built-in email which has strict rate limits (~3-4/hour). The custom Resend-based `send-password-reset` edge function exists but isn't connected to the flow.

## Solution

Create a new edge function that:
1. Uses Supabase Admin API to generate a proper password recovery link with valid tokens
2. Sends that link via Resend (bypassing Supabase's email rate limits)
3. Frontend calls this edge function instead of `supabase.auth.resetPasswordForEmail()`

## Implementation

### Step 1: Create Password Reset Edge Function
Create `supabase/functions/request-password-reset/index.ts`:

```text
┌─────────────────────────────────────────────────────────┐
│                   request-password-reset                 │
├─────────────────────────────────────────────────────────┤
│  1. Receive email from frontend                         │
│  2. Use supabase.auth.admin.generateLink() to create    │
│     a proper recovery link with valid tokens            │
│  3. Send branded email via Resend API                   │
│  4. Return success/error to frontend                    │
└─────────────────────────────────────────────────────────┘
```

Key implementation details:
- Uses `generateLink({ type: 'recovery', email })` for proper token generation
- Sends via Resend API with branded HTML template
- No Supabase email rate limits apply since we're sending via Resend
- Recovery link will work exactly like Supabase's built-in flow

### Step 2: Update Frontend Auth Hook
Modify `src/hooks/useAuth.ts`:

```typescript
// Before (uses Supabase's rate-limited email)
const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {...});
  return { error };
};

// After (uses Resend via edge function)
const resetPassword = async (email: string) => {
  const { data, error } = await supabase.functions.invoke("request-password-reset", {
    body: { email },
  });
  return { error: error || (data?.error ? new Error(data.error) : null) };
};
```

### Step 3: Update Supabase Config
Add JWT verification setting in `supabase/config.toml`:

```toml
[functions.request-password-reset]
verify_jwt = false
```

## Technical Details

| Aspect | Details |
|--------|---------|
| Rate Limits | Resend Free: 100/day, 3,000/month vs Supabase: ~3-4/hour/email |
| Token Handling | Uses `generateLink()` for proper JWT recovery tokens |
| Security | Service role key used only server-side in edge function |
| Existing Flow | `/reset-password` page continues to work unchanged |

## Files to Change

| Action | File |
|--------|------|
| Create | `supabase/functions/request-password-reset/index.ts` |
| Modify | `src/hooks/useAuth.ts` - update `resetPassword()` function |
| Modify | `supabase/config.toml` - add function config |

## Benefits
- No more "email rate limit exceeded" errors for password reset
- Uses your existing Resend account and branded email template
- Proper token/JWT compatibility maintained
- Existing reset password page works without changes
