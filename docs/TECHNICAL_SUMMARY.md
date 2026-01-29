# Autodox Platform - Technical Summary

## Overview

Multi-tenant SMS verification platform with white-label brand portals, custom domain management, and template-driven landing pages.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| UI Components | shadcn/ui + Radix primitives |
| State | TanStack Query (React Query) |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| Hosting | Netlify (custom domains + SSL) |
| Email | Resend API |

---

## Database Schema

### Core Tables

```
brands
├── id, name, slug, status (provisioning|active|suspended|archived)
├── domain, domain_status (pending|verifying|verified|provisioning_ssl|active|failed)
├── domain_verification_token, domain_verified_at, domain_error
├── ssl_status, cloudflare_hostname_id (stores Netlify domain ID)
├── active_template_id → landing_templates
├── applied_template_version, template_applied_at, template_applied_by
├── previous_template_id, previous_template_version (rollback support)
├── monthly_sms_limit, current_month_usage
├── owner_user_id, settings (JSONB)
└── created_at, updated_at

landing_templates
├── id, name, slug, version (auto-increment trigger)
├── base_layout (enum: 8 layout types)
├── status (draft|published|disabled)
├── default_copy (JSONB), default_theme_overrides (JSONB)
├── sections_enabled (JSONB), editable_fields (JSONB)
├── category
└── created_at, updated_at

template_activity_log
├── id, template_id, template_slug, brand_id
├── action, changes (JSONB)
├── performed_by, performed_at
└── Immutable audit trail

profiles
├── id, user_id, email
├── first_name, last_name, phone
├── company_name, website, sms_volume
└── created_at, updated_at

user_roles
├── id, user_id
├── role (admin|super_admin|user)
└── created_at

applications (SMS service applications)
├── id, user_id, company_name, ein
├── monthly_volume, use_case
├── tos_url, privacy_url
├── status (pending|approved|rejected)
└── created_at, updated_at

portal_configs (per-user white-label settings)
├── id, user_id, brand_name
├── logo_url, primary_color, secondary_color
└── created_at, updated_at

tickets, contact_submissions (support)
```

### Enums

```sql
domain_status: pending | verifying | verified | provisioning_ssl | active | failed
brand_status: provisioning | active | suspended | archived
template_status: draft | published | disabled
landing_base_layout: hero_focused | compliance_heavy | trust_signal_dense | 
                     minimal_enterprise | sdk_focused | global_reach | 
                     security_first | conversion_optimized
app_role: admin | super_admin | user
application_status: pending | approved | rejected
```

---

## Custom Domain Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Admin enters domain in EditBrandModal                        │
│    → domain_status = 'pending'                                  │
│    → domain_verification_token generated (crypto.randomUUID)    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. DomainConfigPanel shows DNS instructions:                    │
│    - TXT: _autodox-verify.{domain} → {token}                   │
│    - A record: {domain} → 75.2.60.5 (Netlify LB)               │
│    - OR CNAME: {subdomain} → {site}.netlify.app                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. verify-domain edge function                                  │
│    → DNS-over-HTTPS query to cloudflare-dns.com                │
│    → Checks TXT record matches token                           │
│    → Updates domain_status = 'verified'                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. provision-ssl edge function                                  │
│    → POST to Netlify API: /sites/{siteId}/domains              │
│    → Stores domain ID in cloudflare_hostname_id column         │
│    → domain_status = 'provisioning_ssl'                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. check-domain-status edge function (polling)                  │
│    → GET Netlify domain status                                 │
│    → ssl_status: pending_validation → issued → active          │
│    → When active: domain_status = 'active'                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. serve-brand-landing edge function                            │
│    → Extracts Host header from incoming request                │
│    → Looks up brand by domain                                  │
│    → Returns brand config + template for rendering             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Edge Functions

| Function | Purpose | External APIs |
|----------|---------|---------------|
| `verify-domain` | DNS TXT record verification | Cloudflare DNS-over-HTTPS |
| `provision-ssl` | Register domain with Netlify | Netlify API |
| `check-domain-status` | Poll SSL certificate status | Netlify API |
| `serve-brand-landing` | Resolve brand from Host header | - |
| `send-signup-verification` | Send verification emails | Resend |
| `send-password-reset` | Password reset emails | Resend |
| `send-contact-notification` | Contact form notifications | Resend |
| `notify-application-status` | Application status updates | Resend |

---

## Authentication & Authorization

### RBAC Implementation

```typescript
// Database functions (Postgres)
has_role(_role: app_role, _user_id: uuid) → boolean
is_admin(_user_id: uuid) → boolean

// Frontend hooks
useAdminAuth()     // Checks admin/super_admin role
useAuth()          // Standard auth state
useRoleManagement() // CRUD on user_roles
```

### RLS Pattern

All user-scoped tables use:
```sql
CREATE POLICY "Users can access own data"
ON table_name FOR ALL
USING (auth.uid() = user_id);
```

Admin tables check:
```sql
USING (is_admin(auth.uid()))
```

---

## Template System

### Layout Types (8 deterministic layouts)

1. `hero_focused` - Bold hero section, CTA prominent
2. `compliance_heavy` - Compliance badges, legal focus
3. `trust_signal_dense` - Customer logos, testimonials
4. `minimal_enterprise` - Clean, professional
5. `sdk_focused` - Developer-oriented, code samples
6. `global_reach` - International features
7. `security_first` - Security certifications
8. `conversion_optimized` - A/B tested, high conversion

### Template Application Flow

```typescript
// useBrands hook
applyTemplate(brandId, templateId) → {
  1. Fetch template from landing_templates
  2. Store previous_template_id/version for rollback
  3. Set active_template_id, applied_template_version
  4. Log to template_activity_log
}

rollbackTemplate(brandId) → {
  1. Restore previous_template_id as active
  2. Log rollback action
}
```

### Version Management

```sql
-- Auto-increment trigger on landing_templates
CREATE TRIGGER increment_template_version
BEFORE UPDATE ON landing_templates
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION increment_version();
```

---

## Key Frontend Components

### Admin Components

```
src/components/admin/
├── AdminSidebar.tsx
├── AdminOverview.tsx
├── BrandPortfolioTable.tsx    # Brand list with domain status badges
├── CreateBrandModal.tsx
├── EditBrandModal.tsx         # Tabbed: Details | Domain Config
├── DomainConfigPanel.tsx      # DNS instructions, verification UI
├── UserProfileTable.tsx
├── PortalConfigEditor.tsx
└── templates/
    ├── TemplatesTable.tsx
    ├── TemplateEditorModal.tsx
    ├── TemplatePreviewModal.tsx
    ├── ApplyTemplateToBrandModal.tsx
    └── TemplateActivityLogViewer.tsx
```

### Reusable UI Patterns

```typescript
// Feature gating
<RestrictedFeature requiredRole="admin">
  <AdminContent />
</RestrictedFeature>

// Status display
<StatusPill status="active" />  // green
<StatusPill status="pending" /> // amber
<StatusPill status="failed" />  // red

// Glassmorphism cards
<GlassCard>Content</GlassCard>
```

### Custom Hooks

```
src/hooks/
├── useAuth.ts              # Auth state + session
├── useAdminAuth.ts         # Admin role verification
├── useBrands.ts            # Brand CRUD + template operations
├── useTemplates.ts         # Template CRUD
├── useDomainVerification.ts # Domain lifecycle management
├── usePortalConfig.ts      # White-label settings
├── useProfiles.ts          # User profile management
├── useRoleManagement.ts    # User role CRUD
├── useApplications.ts      # SMS applications
├── useTickets.ts           # Support tickets
└── useTemplatePreview.ts   # Template preview generation
```

---

## Required Secrets

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Email sending via Resend |
| `NETLIFY_ACCESS_TOKEN` | Netlify API authentication |
| `NETLIFY_SITE_ID` | Target Netlify site for domains |

---

## File Structure

```
src/
├── components/
│   ├── admin/           # Admin portal components
│   ├── auth/            # Auth modals, verification
│   ├── dashboard/       # User dashboard components
│   ├── landing/         # Landing page layouts
│   │   └── layouts/     # 8 template layouts
│   ├── portal/          # White-label portal shell
│   └── ui/              # shadcn + custom components
├── hooks/               # React Query hooks
├── pages/
│   ├── admin/           # Admin routes
│   └── dashboard/       # User dashboard routes
├── integrations/
│   └── supabase/        # Auto-generated client + types
└── types/               # TypeScript definitions

supabase/
├── functions/           # Edge functions
│   ├── verify-domain/
│   ├── provision-ssl/
│   ├── check-domain-status/
│   ├── serve-brand-landing/
│   └── ... (email functions)
├── migrations/          # SQL migrations
└── config.toml          # Supabase config
```

---

## API Endpoints (Edge Functions)

### Domain Management

```
POST /verify-domain
Body: { brandId: string, domain: string }
Response: { success: boolean, status: domain_status, error?: string }

POST /provision-ssl
Body: { brandId: string }
Response: { success: boolean, domainId: string, error?: string }

POST /check-domain-status
Body: { brandId: string }
Response: { ssl_status: string, domain_status: domain_status }

GET /serve-brand-landing
Headers: Host: custom-domain.com
Response: { brand: Brand, template: Template, config: PortalConfig }
```

### Email Functions

```
POST /send-signup-verification
Body: { email: string, verificationUrl: string }

POST /send-password-reset
Body: { email: string, resetUrl: string }

POST /send-contact-notification
Body: { name: string, email: string, message: string }

POST /notify-application-status
Body: { applicationId: string, status: string, email: string }
```

---

## Development Notes

### Adding New Template Layouts

1. Create layout component in `src/components/landing/layouts/`
2. Add to `landing_base_layout` enum via migration
3. Register in `LayoutRenderer.tsx`
4. Create template record in `landing_templates`

### Domain Status State Machine

```
pending → verifying → verified → provisioning_ssl → active
    ↓         ↓          ↓              ↓
  failed   failed     failed         failed
```

### Template Versioning

- Every UPDATE to `landing_templates` auto-increments `version`
- Brands store `applied_template_version` to detect drift
- `previous_template_id/version` enables rollback

---

*Last updated: January 2026*
