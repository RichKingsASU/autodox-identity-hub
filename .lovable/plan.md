

# Plan: Enable Password Reset via Resend

## Problem Analysis

The current password reset flow uses Supabase's native email system, which:
1. Has stricter rate limits than Resend
2. Uses default Supabase email templates (not branded)
3. Ignores the existing `send-password-reset` edge function entirely

## Solution: Configure Resend as Custom SMTP in Supabase

The cleanest approach is to configure Supabase to use Resend's SMTP server for all authentication emails. This way:
- All auth emails (password reset, verification, magic links) will go through Resend
- Supabase's secure token generation remains intact
- No code changes needed - just configuration

### Step 1: Get Resend SMTP Credentials

In your Resend dashboard:
1. Go to **SMTP** section (https://resend.com/settings/smtp)
2. Note down:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) or `587` (TLS)
   - Username: `resend`
   - Password: Your API key (`re_xxxxx`)

### Step 2: Configure Supabase Auth SMTP

In your external Supabase dashboard (https://supabase.com/dashboard/project/iqluzpzttzoaybbjvtsr):

1. Go to **Authentication** → **Email Templates** → **SMTP Settings**
2. Enable custom SMTP and enter:
   - Sender email: `noreply@yourdomain.com` (must match verified Resend domain)
   - Sender name: `Autodox`
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: Your `RESEND_API_KEY`
3. Click **Save**

### Step 3: Customize Email Templates (Optional)

In the same **Email Templates** section, customize:
- **Reset Password** template with your branded HTML
- **Confirm Signup** template (currently using the edge function, but can consolidate here)

## Alternative: Custom Token Flow

If you prefer using the existing `send-password-reset` edge function for more control, we would need to:

1. Create a `password_reset_tokens` table to store custom tokens
2. Modify `resetPassword()` to generate a token, store it, then call the edge function
3. Update `ResetPassword.tsx` to validate our custom tokens

This is more complex but gives full control over the email content and flow.

---

## Recommended Approach

**Use Option 1 (SMTP Configuration)** because:
- No code changes required
- Maintains Supabase's secure token handling
- All auth emails become branded automatically
- Simpler to maintain

## Technical Notes

- The `send-password-reset` edge function can be removed after SMTP is configured (it's currently unused)
- Rate limits will be determined by Resend instead of Supabase
- The existing `ResetPassword.tsx` page will continue to work as-is

