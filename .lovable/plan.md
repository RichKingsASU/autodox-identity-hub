
# Migration to External Supabase + Netlify Deployment

## Your New Supabase Project
- **URL**: `https://iqluzpzttzoaybbjvtsr.supabase.co`
- **Project ID**: `iqluzpzttzoaybbjvtsr`

---

## Files to Create

### 1. `supabase/schema.sql` - Consolidated Database Schema
A single SQL file combining all 15 migrations for import into your new Supabase project via SQL Editor.

**Contents:**
- 6 Enums: `application_status`, `brand_status`, `app_role`, `template_status`, `landing_base_layout`, `domain_status`
- 9 Tables: `profiles`, `applications`, `brands`, `landing_templates`, `portal_configs`, `user_roles`, `tickets`, `contact_submissions`, `template_activity_log`
- 5 Functions: `update_updated_at_column()`, `handle_new_user()`, `has_role()`, `is_admin()`, `increment_template_version()`, `prevent_activity_log_modification()`, `notify_application_status_change()`
- All RLS policies (30+ policies)
- All triggers and indexes
- Storage bucket setup
- 60 seed templates

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

### 3. Update `.env` (for reference/local dev)
```env
VITE_SUPABASE_URL="https://iqluzpzttzoaybbjvtsr.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_ANON_KEY"
VITE_SUPABASE_PROJECT_ID="iqluzpzttzoaybbjvtsr"
```

### 4. Update `supabase/config.toml`
```toml
project_id = "iqluzpzttzoaybbjvtsr"
```

### 5. Update Edge Function URLs
The `notify_application_status_change()` function has a hardcoded URL that needs updating:
```sql
-- Change from:
'https://eecxwrxxtbaecbblpovl.supabase.co/functions/v1/notify-application-status'
-- To:
'https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/notify-application-status'
```

---

## Deployment Steps (Post-Implementation)

### Step 1: Import Schema
1. Go to Supabase Dashboard → SQL Editor
2. Paste the entire `schema.sql` contents
3. Run the query

### Step 2: Create Auth Trigger (Requires SQL Editor)
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Step 3: Deploy Edge Functions via CLI
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

### Step 4: Configure Secrets in New Supabase
Dashboard → Edge Functions → Secrets:
- `RESEND_API_KEY`
- `NETLIFY_ACCESS_TOKEN`
- `NETLIFY_SITE_ID`

### Step 5: Deploy to Netlify
1. Push to GitHub
2. Create Netlify site → Link repo
3. Add environment variables in Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`

### Step 6: Configure Supabase Auth URLs
Dashboard → Authentication → URL Configuration:
- Site URL: Your Netlify domain
- Redirect URLs: Add your Netlify domain

---

## Technical Notes

- The `cloudflare_hostname_id` column is reused for Netlify domain IDs
- Storage bucket `portal-logos` must be created manually in new project
- The `handle_new_user()` trigger on `auth.users` requires SQL Editor (not migration file)
- All 60 seed templates will be included in the schema
