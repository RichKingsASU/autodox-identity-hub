
# Fix Email System - Critical Bug Fixes

## Problem Summary

The email system is completely broken due to three interconnected bugs introduced during the recent refactoring:

1. **Non-existent table reference** - Edge functions query a `domains` table that doesn't exist
2. **Missing required field** - `email_logs` inserts fail because `from_email` is required but not provided
3. **Inconsistent architecture** - Some functions weren't updated to use the new `brand_email_settings` table

---

## Phase 1: Fix `request-password-reset` Function

### Changes Required

Remove the broken `domains` table query and use `brand_email_settings` instead:

**Before (broken):**
```typescript
const { data: brandData } = await supabase
  .from("brands")
  .select(`name, domains (domain, status)`)  // domains table doesn't exist!
  .eq("domains.is_primary", true)
  .eq("domains.status", "verified")
```

**After (fixed):**
```typescript
// Get brand email settings for dynamic sender
const { data: settings } = await supabase
  .from("brand_email_settings")
  .select("from_name, from_email")
  .limit(1)
  .single();

const fromName = settings?.from_name || "Autodox";
const fromEmail = settings?.from_email || "noreply@email.agents-institute.com";
const fromAddress = `${fromName} <${fromEmail}>`;
```

### Also Fix `email_logs` Insert

Add the required `from_email` field:

```typescript
await supabase.from("email_logs").insert({
  to_email: email,
  from_email: fromAddress,  // ADD THIS
  subject: `Reset Your Password - ${fromName}`,
  resend_id: resendData.id || null,
  status: status,
});
```

---

## Phase 2: Fix `send-signup-verification` Function

### Same Pattern of Fixes

Remove broken `domains` query, use `brand_email_settings`:

```typescript
// Resolve sender from brand_email_settings
let fromName = "Autodox";
let fromEmail = "noreply@email.agents-institute.com";

const { data: settings } = await supabase
  .from("brand_email_settings")
  .select("from_name, from_email")
  .limit(1)
  .single();

if (settings) {
  fromName = settings.from_name;
  fromEmail = settings.from_email;
}

const fromAddress = `${fromName} <${fromEmail}>`;
```

Fix the `email_logs` insert to include `from_email`.

---

## Phase 3: Add Error Logging

Both functions should log errors to `debug_logs` table for visibility:

```typescript
} catch (error: any) {
  // Log to debug_logs for admin visibility
  await supabase.from("debug_logs").insert({
    function_name: "request-password-reset",
    error_type: "error",
    error_message: error.message,
    error_stack: error.stack || null,
  });
  
  return new Response(
    JSON.stringify({ error: "An unexpected error occurred" }),
    { status: 500, headers: corsHeaders }
  );
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/request-password-reset/index.ts` | Remove domains query, use brand_email_settings, fix email_logs insert, add debug logging |
| `supabase/functions/send-signup-verification/index.ts` | Same fixes as above |

---

## Testing Plan

After deployment:
1. Trigger a password reset to verify `request-password-reset` works
2. Sign up a new user to verify `send-signup-verification` works
3. Check `email_logs` table to confirm logging works
4. Check `debug_logs` table to ensure no errors are captured

---

## Expected Outcome

- Emails will send successfully using the configured sender from `brand_email_settings`
- All email activities logged to `email_logs` with complete data
- Any failures captured in `debug_logs` for debugging
- No more silent failures due to non-existent table references
