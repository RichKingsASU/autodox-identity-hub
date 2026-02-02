# 🚀 Deployment Guide: Multi-Brand Identity Hub

This guide details the steps to deploy the production-ready email system and domain management features.

## 1. Prerequisites

Ensure you have accounts and API keys for:
*   **Resend** (Email Delivery): [https://resend.com](https://resend.com)
*   **Netlify** (Domain Management & Hosting): [https://netlify.com](https://netlify.com)
*   **Supabase** (Backend): Your existing project.

## 2. Environment Variables & Secrets

You must configure the following secrets in your Supabase project for the Edge Functions to work.

### Run via Supabase CLI:
```bash
supabase secrets set RESEND_API_KEY=re_123456789
supabase secrets set NETLIFY_ACCESS_TOKEN=nfp_123456789
supabase secrets set NETLIFY_SITE_ID=your-netlify-site-id
```

### Or set via Supabase Dashboard:
Go to **Project Settings > Edge Functions > Secrets** and add:
*   `RESEND_API_KEY`
*   `NETLIFY_ACCESS_TOKEN`
*   `NETLIFY_SITE_ID`

## 3. Deployment Steps

### Step 1: Database
Your database migrations are already created. To apply them to your remote production database:

```bash
supabase db push
```

### Step 2: Edge Functions
Deploy the email and domain management functions:

```bash
supabase functions deploy send-email
supabase functions deploy send-brand-event-email
supabase functions deploy resend-domain-status
supabase functions deploy add-domain-to-netlify
supabase functions deploy verify-domain-dns
supabase functions deploy check-ssl-status
```

### Step 3: Frontend (Admin UI)
Build the production assets:

```bash
npm run build
```

The output will be in the `dist/` folder. Deploy this folder to Netlify (or your hosting provider).

## 4. Verification

After deployment, refer to the manual test guides located in `supabase/tests/`:

*   📄 `manual_domain_tests.md`: Test adding a custom domain.
*   📄 `manual_email_tests.md`: Test sending a brand email.

## 5. Troubleshooting

*   **Email Failures**: Check the `email_events` table in Supabase for error logs.
*   **Domain Issues**: Check the browser console in the Admin UI for specific error messages from the Edge Functions.
*   **Logs**: View Edge Function logs in the Supabase Dashboard for detailed execution traces.
