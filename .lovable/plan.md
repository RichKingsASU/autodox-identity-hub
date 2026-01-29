
# Complete Brand Domain Configuration & Deployment System

## Overview

This plan implements end-to-end custom domain management for brands, from configuration in the admin portal through DNS verification to live deployment with SSL via Cloudflare for SaaS.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         ADMIN PORTAL                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │ Edit Brand Modal │ -> │ Domain Config    │ -> │ Verification     │   │
│  │ (set domain)     │    │ Panel (DNS info) │    │ Status Display   │   │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Edge Functions)                         │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │ verify-domain    │    │ provision-ssl    │    │ check-domain     │   │
│  │ (DNS TXT check)  │    │ (Cloudflare API) │    │ (status polling) │   │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE FOR SAAS                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Custom Hostnames API                                              │   │
│  │ - Creates SSL certificate per brand domain                        │   │
│  │ - Routes traffic to your origin (Lovable preview)                 │   │
│  │ - Automatic certificate renewal                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Schema Updates

### New Columns for `brands` Table

| Column | Type | Purpose |
|--------|------|---------|
| `domain_status` | enum | pending, verifying, verified, provisioning_ssl, active, failed |
| `domain_verification_token` | text | Unique token for TXT record verification |
| `domain_verified_at` | timestamp | When DNS verification succeeded |
| `ssl_status` | text | Cloudflare SSL provisioning status |
| `cloudflare_hostname_id` | text | Cloudflare custom hostname ID for management |
| `domain_error` | text | Last error message if failed |

### Domain Status Enum

```sql
CREATE TYPE domain_status AS ENUM (
  'pending',          -- Domain entered, awaiting verification
  'verifying',        -- Verification in progress
  'verified',         -- DNS verified, SSL not yet provisioned
  'provisioning_ssl', -- Cloudflare creating SSL certificate
  'active',           -- Fully deployed and serving traffic
  'failed'            -- Verification or SSL failed
);
```

---

## Phase 2: Admin UI Components

### 2.1 Edit Brand Modal
Enhance the existing brand management with domain configuration:

- Domain input field
- "Configure Domain" button that opens detailed panel
- Status indicator showing current domain state

### 2.2 Domain Configuration Panel
A dedicated panel/modal for domain setup showing:

| Section | Contents |
|---------|----------|
| **Domain Input** | Input field for custom domain (e.g., `verify.acme.com`) |
| **DNS Instructions** | Step-by-step setup with copyable values |
| **TXT Record** | `_autodox-verify.{domain}` with unique token |
| **CNAME Record** | Points to Cloudflare proxy |
| **Status Tracker** | Visual progress through verification stages |
| **Actions** | "Verify Now" button, "Retry" if failed |

### 2.3 Domain Status Badge
Visual indicator in the Brand Portfolio Table:

| Status | Badge | Color |
|--------|-------|-------|
| No domain | "Not Configured" | Gray |
| Pending | "DNS Pending" | Amber |
| Verifying | "Verifying..." | Blue (animated) |
| Verified | "Verified" | Green |
| Provisioning SSL | "SSL Pending" | Blue |
| Active | "Live" | Green with checkmark |
| Failed | "Failed" | Red with retry option |

---

## Phase 3: Edge Functions

### 3.1 `verify-domain` Edge Function
Checks DNS TXT record to verify domain ownership:

**Flow:**
1. Receive brand ID and domain
2. Generate verification token if not exists
3. Query DNS for `_autodox-verify.{domain}` TXT record
4. Compare token value
5. Update `domain_status` to `verified` on success
6. Return result with next steps

**DNS Query Method:**
Uses Cloudflare's DNS-over-HTTPS API for reliable DNS lookups:
```
https://cloudflare-dns.com/dns-query?name=_autodox-verify.example.com&type=TXT
```

### 3.2 `provision-ssl` Edge Function
Provisions SSL certificate via Cloudflare for SaaS:

**Flow:**
1. Receive verified brand ID
2. Call Cloudflare Custom Hostnames API to create hostname
3. Store `cloudflare_hostname_id` in database
4. Poll for SSL certificate status
5. Update `domain_status` to `active` when complete

**Cloudflare API Endpoints:**
- POST `/zones/{zone_id}/custom_hostnames` - Create hostname
- GET `/zones/{zone_id}/custom_hostnames/{hostname_id}` - Check status

### 3.3 `check-domain-status` Edge Function
Polls current domain and SSL status:

**Used for:**
- UI polling during verification
- Periodic health checks
- Re-verification after failures

---

## Phase 4: Cloudflare for SaaS Setup

### What You Need from Cloudflare

| Item | Where to Find | Purpose |
|------|---------------|---------|
| Zone ID | Dashboard → Your domain → Overview | Identifies your zone |
| API Token | My Profile → API Tokens | Authentication |
| Fallback Origin | Your proxy domain | Where traffic routes |

### Required Cloudflare Configuration

1. **Enable Cloudflare for SaaS** on your zone
2. **Create fallback origin** (e.g., `brands-origin.yourdomain.com`)
3. **Configure DNS** to point fallback to Lovable preview/your server
4. **Generate API token** with `Zone:SSL and Certificates:Edit` permission

### Secrets Required

| Secret Name | Description |
|-------------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token with Custom Hostnames permission |
| `CLOUDFLARE_ZONE_ID` | Your zone identifier |
| `CLOUDFLARE_FALLBACK_ORIGIN` | Origin server for brand traffic |

---

## Phase 5: Brand Landing Page Routing

### How Brand Pages Are Served

When a request comes to `verify.acme.com`:

```text
1. Cloudflare receives request for verify.acme.com
2. Custom Hostname config routes to fallback origin
3. Origin receives Host header: verify.acme.com
4. Edge function/server looks up brand by domain
5. Returns brand's landing page with applied template
```

### New Edge Function: `serve-brand-landing`

This function serves the brand's landing page based on the incoming domain:

**Flow:**
1. Extract domain from Host header
2. Query `brands` table for matching domain
3. Fetch brand's active template configuration
4. Render landing page with template + brand customizations
5. Return HTML response

---

## Implementation Steps

### Step 1: Database Migration
Create migration to add domain management columns to `brands` table.

### Step 2: Create Domain Hooks
Build `useDomainVerification` hook for:
- Initiating verification
- Polling status
- Handling errors

### Step 3: Build Edit Brand Modal
Create/enhance modal with:
- Domain input
- Configuration instructions
- Status display
- Action buttons

### Step 4: Create Verification Edge Function
Build `verify-domain` function using DNS-over-HTTPS.

### Step 5: Create SSL Provisioning Edge Function
Build `provision-ssl` function integrating Cloudflare API.

### Step 6: Update Brand Portfolio Table
Add domain status column with visual indicators.

### Step 7: Create Brand Landing Server
Build `serve-brand-landing` edge function for serving pages.

### Step 8: Integration Testing
Test full flow from domain entry to live serving.

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/xxx_add_domain_columns.sql` | Create | Add domain management columns |
| `src/hooks/useDomainVerification.ts` | Create | Domain verification state management |
| `src/components/admin/EditBrandModal.tsx` | Create | Brand editing with domain config |
| `src/components/admin/DomainConfigPanel.tsx` | Create | DNS instructions and status display |
| `src/components/admin/BrandPortfolioTable.tsx` | Modify | Add domain status column |
| `src/pages/admin/AdminBrands.tsx` | Modify | Integrate edit modal |
| `supabase/functions/verify-domain/index.ts` | Create | DNS TXT verification |
| `supabase/functions/provision-ssl/index.ts` | Create | Cloudflare SSL provisioning |
| `supabase/functions/serve-brand-landing/index.ts` | Create | Serve brand pages by domain |
| `src/hooks/useBrands.ts` | Modify | Add domain management methods |

---

## Security Considerations

- Verification tokens are cryptographically random
- Cloudflare API token stored as secret (not in code)
- Domain status only changeable via edge functions (not directly)
- RLS policies ensure only admins can modify brand domains

---

## User Experience Flow

### Admin Configuring a Domain

1. Navigate to Admin → Brands
2. Click "Edit" on a brand
3. Enter custom domain: `verify.acme.com`
4. See DNS instructions with copyable values:
   - TXT Record: `_autodox-verify.verify.acme.com` → `autodox_verify_abc123`
   - CNAME Record: `verify.acme.com` → `brands.yourdomain.com`
5. Click "Verify Domain"
6. Status updates: Pending → Verifying → Verified → Provisioning SSL → Active
7. Domain shows green "Live" badge in table
8. Brand landing page now accessible at `https://verify.acme.com`

---

## Prerequisites Before Implementation

Before building this system, you'll need to:

1. **Create a Cloudflare account** (free tier works)
2. **Add a domain to Cloudflare** (this becomes your "zone")
3. **Enable Cloudflare for SaaS** (in SSL/TLS → Custom Hostnames)
4. **Create an API token** with Custom Hostnames permissions
5. **Decide on origin strategy**:
   - Option A: Edge function serves all brand pages
   - Option B: Static builds deployed per brand (more complex)

Would you like me to proceed with implementation once you've set up Cloudflare? I can start with the database schema and UI components while you configure Cloudflare, then integrate the APIs once you have the credentials.
