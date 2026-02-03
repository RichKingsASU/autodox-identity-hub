
# Fix Email System and Configure Missing Secrets

## Summary
The email system is failing because the `RESEND_API_KEY` in Supabase Edge Function secrets is invalid. All 10+ recent email attempts show "API key is invalid" errors. Additionally, secrets for Netlify domain management are missing.

## Current Issues Found

1. **Email Failures**: All emails failing with 401 "API key is invalid"
2. **Missing Secrets**: 
   - `NETLIFY_ACCESS_TOKEN` (required for domain SSL provisioning)
   - `NETLIFY_SITE_ID` (required for domain SSL provisioning)

## Fix Plan

### Step 1: Verify and Update RESEND_API_KEY

The `RESEND_API_KEY` secret exists but the stored value is not working. You need to manually update it in Supabase:

1. Go to your **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**
2. Find `RESEND_API_KEY` and click **Edit**
3. Paste the new API key: `re_BdMGSMpF_KYBfz6bVyLewKfnCJyGQEGaX`
4. Save the changes

**Important**: After updating, wait 30-60 seconds for the edge functions to pick up the new value.

### Step 2: Redeploy Edge Functions

After updating the secret, I will redeploy all email-related edge functions to ensure they use the updated environment:

- `send-contact-notification`
- `send-email`
- `send-brand-event-email`
- `send-password-reset`
- `send-signup-verification`
- `request-password-reset`
- `notify-application-status`

### Step 3: Test Email System

I will call the `send-contact-notification` edge function with a test payload to verify emails are now sending successfully.

### Step 4: Add Missing Netlify Secrets (Optional)

For full domain management functionality, add these secrets in Supabase:

| Secret Name | Where to Get It |
|-------------|-----------------|
| `NETLIFY_ACCESS_TOKEN` | Netlify Dashboard → User Settings → Applications → Personal Access Tokens |
| `NETLIFY_SITE_ID` | Netlify Dashboard → Your Site → Site Configuration → General → Site ID |

---

## Technical Details

### Edge Functions Affected
All 7 email edge functions use the sender domain `email.agents-institute.com` which matches your verified Resend domain - this is correct.

### Database Status
- `email_logs` table: 10+ failed entries with "API key is invalid"
- `debug_logs` table: Empty (no application-level errors)

### Root Cause
The `RESEND_API_KEY` secret stored in Supabase does not match a valid Resend API key, causing all Resend API calls to return 401 Unauthorized.

---

## Action Required From You

Before I can implement the fix:

**Confirm you have updated the `RESEND_API_KEY` in Supabase Dashboard → Project Settings → Edge Functions → Secrets**

Once confirmed, I will:
1. Redeploy all edge functions
2. Test the email system
3. Verify successful delivery
