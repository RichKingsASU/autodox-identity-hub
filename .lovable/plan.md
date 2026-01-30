

# Implementation: Create Migration Files for External Supabase + Netlify Deployment

## Overview
Create all files needed to migrate the Autodox platform from Lovable Cloud to an external Supabase instance (`iqluzpzttzoaybbjvtsr`) with Netlify deployment.

---

## Files to Create

### 1. `supabase/schema.sql` - Consolidated Database Schema (~800 lines)

This file combines all 15 migrations into a single SQL file for import into your new Supabase project.

**Contents:**
- Enable required extensions (pg_net for HTTP calls)
- 6 Enums: `application_status`, `brand_status`, `app_role`, `template_status`, `landing_base_layout`, `domain_status`
- 9 Tables with full column definitions
- 7 Database functions (with updated edge function URL pointing to new project)
- 30+ RLS policies
- All triggers and indexes
- Storage bucket setup
- 60 seed templates

**Key change from original migrations:**
```sql
-- Updated URL in notify_application_status_change()
'https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/notify-application-status'
```

---

### 2. `netlify.toml` - Deployment Configuration

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### 3. Update `.lovable/plan.md` - Deployment Instructions

Update the existing plan with finalized instructions and your new Supabase project details.

---

## Technical Details

### Schema Order (Dependencies Respected)
1. Extensions (pg_net)
2. Enums (must come before tables that use them)
3. Core tables (profiles, applications)
4. Admin tables (user_roles, brands, landing_templates, template_activity_log)
5. Support tables (portal_configs, tickets, contact_submissions)
6. Functions (handle_new_user, has_role, is_admin, etc.)
7. Triggers (updated_at, version increment, activity log protection)
8. RLS policies
9. Indexes
10. Storage bucket + policies
11. Seed data (60 templates)

### Post-Import Manual Steps
After running `schema.sql`, you must run this separately in SQL Editor (cannot be in migration file):
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Edge Function Deployment Commands
```bash
supabase login
supabase link --project-ref iqluzpzttzoaybbjvtsr
supabase functions deploy verify-domain
supabase functions deploy provision-ssl
supabase functions deploy check-domain-status
supabase functions deploy serve-brand-landing
supabase functions deploy notify-application-status --no-verify-jwt
supabase functions deploy send-contact-notification
supabase functions deploy send-password-reset --no-verify-jwt
supabase functions deploy send-signup-verification --no-verify-jwt
```

### Required Secrets in New Supabase
- `RESEND_API_KEY`
- `NETLIFY_ACCESS_TOKEN`
- `NETLIFY_SITE_ID`

### Netlify Environment Variables
- `VITE_SUPABASE_URL` = `https://iqluzpzttzoaybbjvtsr.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = Your anon key
- `VITE_SUPABASE_PROJECT_ID` = `iqluzpzttzoaybbjvtsr`

---

## Summary

| File | Lines | Purpose |
|------|-------|---------|
| `supabase/schema.sql` | ~800 | Full database schema for SQL Editor import |
| `netlify.toml` | 10 | Build + SPA routing config |
| `.lovable/plan.md` | Updated | Deployment documentation |

