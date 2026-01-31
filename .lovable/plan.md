# Autodox Platform - External Deployment Guide

## Overview

This guide covers deploying the Autodox platform to an external Supabase instance with Netlify hosting.

**Target Supabase Project:** `iqluzpzttzoaybbjvtsr`

---

## Files Created

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Consolidated database schema (~1000 lines) |
| `netlify.toml` | Netlify build + SPA routing config |

---

## Deployment Steps

### Step 1: Import Database Schema

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/iqluzpzttzoaybbjvtsr
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste and click **Run**
5. Wait for completion (this creates all tables, functions, policies, and seed data)

### Step 2: Create Auth Trigger (REQUIRED)

After the schema import, run this separately in SQL Editor:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

> **Why separate?** This trigger targets the `auth` schema which cannot be modified in standard migration files.

### Step 3: Configure Supabase Secrets

In your Supabase dashboard, go to **Settings → Edge Functions → Secrets** and add:

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Email sending via Resend |
| `NETLIFY_ACCESS_TOKEN` | Netlify API authentication |
| `NETLIFY_SITE_ID` | Target Netlify site for custom domains |

### Step 4: Deploy Edge Functions

From your local machine with Supabase CLI installed:

```bash
# Login and link to project
supabase login
supabase link --project-ref iqluzpzttzoaybbjvtsr

# Deploy all edge functions
supabase functions deploy verify-domain
supabase functions deploy provision-ssl
supabase functions deploy check-domain-status
supabase functions deploy serve-brand-landing
supabase functions deploy notify-application-status --no-verify-jwt
supabase functions deploy send-contact-notification
supabase functions deploy send-password-reset --no-verify-jwt
supabase functions deploy send-signup-verification --no-verify-jwt
```

### Step 5: Deploy to Netlify

1. Push code to your Git repository
2. Connect repository to Netlify
3. Configure environment variables in Netlify dashboard:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://iqluzpzttzoaybbjvtsr.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your anon key from Supabase dashboard |
| `VITE_SUPABASE_PROJECT_ID` | `iqluzpzttzoaybbjvtsr` |

4. Deploy!

---

## Schema Contents

The consolidated schema includes:

### Extensions
- `pg_net` for HTTP calls from database triggers

### Enums (6)
- `application_status`: pending, approved, rejected
- `app_role`: admin, super_admin, user
- `brand_status`: provisioning, active, suspended, archived
- `template_status`: draft, published, disabled
- `landing_base_layout`: 8 layout types
- `domain_status`: pending, verifying, verified, provisioning_ssl, active, failed

### Tables (9)
- `profiles` - User profile data
- `applications` - SMS service applications
- `user_roles` - RBAC roles
- `brands` - Multi-tenant brand management
- `landing_templates` - Template library
- `template_activity_log` - Immutable audit trail
- `portal_configs` - White-label theming
- `tickets` - Support tickets
- `contact_submissions` - Contact form submissions

### Functions (7)
- `handle_new_user()` - Auto-create profile on signup
- `update_updated_at_column()` - Timestamp management
- `has_role()` - Role checking
- `is_admin()` - Admin verification
- `increment_template_version()` - Auto-version templates
- `prevent_activity_log_modification()` - Audit log protection
- `notify_application_status_change()` - Webhook trigger

### RLS Policies (30+)
Comprehensive row-level security for all tables

### Seed Data
60 pre-built landing page templates across 8 categories

---

## Edge Functions

| Function | JWT | Purpose |
|----------|-----|---------|
| `verify-domain` | Required | DNS TXT record verification |
| `provision-ssl` | Required | Register domain with Netlify |
| `check-domain-status` | Required | Poll SSL certificate status |
| `serve-brand-landing` | Required | Resolve brand from Host header |
| `notify-application-status` | **None** | Application status webhooks |
| `send-contact-notification` | Required | Contact form emails |
| `send-password-reset` | **None** | Password reset emails |
| `send-signup-verification` | **None** | Signup verification emails |

---

## Custom Domain Flow

```
1. Admin enters domain → domain_status = 'pending'
2. DNS instructions shown (TXT record + A/CNAME)
3. verify-domain checks DNS → domain_status = 'verified'
4. provision-ssl registers with Netlify → domain_status = 'provisioning_ssl'
5. check-domain-status polls → domain_status = 'active'
6. serve-brand-landing resolves requests by Host header
```

---

## Troubleshooting

### "Function not found" errors
Ensure all edge functions are deployed with correct `--no-verify-jwt` flags

### Auth trigger not working
Manually run the auth trigger SQL in Step 2

### Custom domains not working
1. Check DNS propagation (can take 24-48 hours)
2. Verify NETLIFY_ACCESS_TOKEN and NETLIFY_SITE_ID secrets are set
3. Check edge function logs in Supabase dashboard

---

*Last updated: January 2026*
