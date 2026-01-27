

# Admin Template Management System - Implementation Plan

## Executive Summary

This plan implements a carrier-safe, audit-grade Admin Template Management System for Autodox. The system enables internal admins to manage 60 landing page templates across brands without code changes, while enforcing compliance safety, layout immutability, and full auditability.

---

## Architecture Overview

```text
+------------------+     +-------------------+     +------------------+
|   Admin UI       |     |   landing_        |     |   brands         |
|   /admin/        |---->|   templates       |<----|   (extended)     |
|   templates      |     |   (new table)     |     |                  |
+------------------+     +-------------------+     +------------------+
        |                        |                        |
        v                        v                        v
+------------------+     +-------------------+     +------------------+
|   8 Base Layout  |     | template_activity |     |   LayoutRenderer |
|   Components     |     |   _log (audit)    |     |   (switch)       |
+------------------+     +-------------------+     +------------------+
```

---

## Phase 1: Database Architecture

### 1.1 Create Custom ENUM Types

Two new PostgreSQL enums will be created to enforce type safety:

| Enum Name | Values |
|-----------|--------|
| `landing_base_layout` | hero_focused, compliance_heavy, trust_signal_dense, minimal_enterprise, sdk_focused, global_reach, security_first, conversion_optimized |
| `template_status` | draft, published, disabled |

### 1.2 Create `landing_templates` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Unique identifier |
| name | text | NOT NULL | Display name |
| slug | text | UNIQUE, NOT NULL | URL-safe identifier for seeding/references |
| category | text | DEFAULT 'landing' | Template category |
| base_layout | landing_base_layout | NOT NULL | Fixed layout enum |
| version | integer | NOT NULL, DEFAULT 1 | Auto-increments on update |
| status | template_status | NOT NULL, DEFAULT 'draft' | Lifecycle state |
| editable_fields | jsonb | NOT NULL | Controlled field definitions |
| default_copy | jsonb | NOT NULL | Headlines, CTAs, disclaimers |
| default_theme_overrides | jsonb | NOT NULL | Primary/accent colors |
| sections_enabled | jsonb | NOT NULL | Section visibility (hidden from UI) |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last modification |

### 1.3 Extend `brands` Table

New columns for template binding and rollback:

| Column | Type | Purpose |
|--------|------|---------|
| active_template_id | uuid (FK) | References landing_templates.id |
| applied_template_version | integer | Version snapshot at application time |
| template_applied_at | timestamptz | When template was applied |
| template_applied_by | uuid | Admin who applied |
| previous_template_id | uuid | For rollback capability |
| previous_template_version | integer | Previous version for rollback |

### 1.4 Create `template_activity_log` Table (Immutable)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| template_id | uuid | FK to landing_templates |
| template_slug | text | Denormalized for audit readability |
| brand_id | uuid (nullable) | FK to brands (for apply actions) |
| action | text | created, updated, applied, disabled, published, reverted |
| changes | jsonb | Safe diff (no PII) |
| performed_by | uuid | Admin user_id |
| performed_at | timestamptz | Timestamp |

### 1.5 Database Triggers

**Version Auto-Increment Trigger:**
- Automatically bumps `version` on any UPDATE to landing_templates
- Also updates `updated_at` timestamp

**Immutable Activity Log Protection:**
- Two triggers to prevent UPDATE and DELETE on template_activity_log
- Raises exception if modification attempted
- Ensures audit trail cannot be tampered with

**Safe Diff Logging Function:**
- Only logs template-related field changes
- Never logs PII, emails, tokens, or secrets
- Creates structured JSON diff for audit review

### 1.6 RLS Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| landing_templates | Admin only | Admin only | Admin only | None (disabled) |
| template_activity_log | Admin only | Admin only | None (trigger blocks) | None (trigger blocks) |

---

## Phase 2: Base Layout Engine

### 2.1 Layout Components (8 Fixed Layouts)

Each layout is a deterministic React component that accepts configuration props and renders using Obsidian design tokens:

| Layout Name | Component File | Focus Area | Key Visual Elements |
|-------------|----------------|------------|---------------------|
| Hero Focused | HeroFocusedLayout.tsx | Bold headline | Full-width hero, minimal sections |
| Compliance Heavy | ComplianceHeavyLayout.tsx | Certifications | SOC2, HIPAA, PCI badges prominent |
| Trust Signal Dense | TrustSignalDenseLayout.tsx | Social proof | Logos, testimonials, stats |
| Minimal Enterprise | MinimalEnterpriseLayout.tsx | Clean professional | Whitespace, typography focus |
| SDK Focused | SDKFocusedLayout.tsx | Developer-centric | Code blocks, API references |
| Global Reach | GlobalReachLayout.tsx | International | World map, region indicators |
| Security First | SecurityFirstLayout.tsx | Security certs | Shield icons, encryption visuals |
| Conversion Optimized | ConversionOptimizedLayout.tsx | CTAs | Multiple CTAs, form emphasis |

### 2.2 Common Layout Props Interface

All layouts receive identical props structure:

```text
LayoutProps {
  copy: {
    heroHeadline: string (max 100 chars)
    heroSubheadline: string (max 200 chars)
    primaryCtaText: string (max 30 chars)
    trustBadgeText: string (max 50 chars)
    footerDisclaimer: string (max 500 chars)
    badgeText: string
    featureItems: FeatureItem[]
    trustItems: string[]
    complianceBadges: string[]
  }
  theme: {
    primaryColor: string (hex)
    accentColor: string (hex)
  }
  sectionsEnabled: {
    hero: boolean
    features: boolean
    pricing: boolean
    trustBadges: boolean
    testimonials: boolean
    compliance: boolean
    footer: boolean
  }
  previewMode?: boolean
}
```

### 2.3 LayoutRenderer Component

A switch component that:
- Maps `base_layout` enum values to React components
- Passes copy, theme, and sectionsEnabled props
- Falls back safely on invalid/unknown layout values
- Adds "Preview Mode - Not Live" badge when previewMode is true

Design enforcement:
- All layouts use Obsidian background (#020617)
- All use GlassCard components
- All use GradientButton for CTAs
- 8px spacing grid
- 24px corner radius (--radius: 1.5rem)

---

## Phase 3: Admin UI Components

### 3.1 File Structure

```text
src/
  components/
    admin/
      templates/
        TemplatesTable.tsx           # Lightweight list
        TemplatePreviewModal.tsx     # Read-only preview
        TemplateEditorModal.tsx      # Controlled field editing
        ApplyTemplateToBrandModal.tsx
        RevertTemplateModal.tsx      # Rollback confirmation
        TemplateActivityLog.tsx      # Audit trail viewer
    landing/
      layouts/
        HeroFocusedLayout.tsx
        ComplianceHeavyLayout.tsx
        TrustSignalDenseLayout.tsx
        MinimalEnterpriseLayout.tsx
        SDKFocusedLayout.tsx
        GlobalReachLayout.tsx
        SecurityFirstLayout.tsx
        ConversionOptimizedLayout.tsx
        LayoutRenderer.tsx
  hooks/
    useTemplates.ts                  # CRUD operations
    useTemplatePreview.ts            # Lazy loading for preview
  pages/
    admin/
      AdminTemplates.tsx             # Main templates page
  types/
    templates.ts                     # TypeScript interfaces
```

### 3.2 Templates List Page (`/admin/templates`)

**Table Columns:**
- Template Name
- Slug (monospace, copyable)
- Base Layout (badge style)
- Version (v1, v2, etc.)
- Status (Draft/Published/Disabled via StatusPill)
- Last Updated
- Actions (Preview, Edit, Apply, Disable)

**Features:**
- Search by name or slug
- Filter by base layout dropdown
- Filter by status dropdown
- Pagination (20 per page)
- "Apply to Brand" only enabled for `published` templates

**Performance Optimization:**
- List page queries only metadata columns
- No JSONB fields loaded in list view
- Lazy loading for preview modal

### 3.3 Template Preview Modal

- Opens with loading skeleton
- Fetches full template data on open (lazy load via useTemplatePreview hook)
- Renders base layout with default copy and theme
- "Preview Mode - Not Live" fixed badge overlay
- Shows: name, slug, base layout, version, status
- Read-only - no editing controls
- Close button only

### 3.4 Template Editor Modal (Controlled)

**Editable Fields (form inputs):**

| Field | Input Type | Max Length |
|-------|-----------|------------|
| Hero Headline | text | 100 chars |
| Hero Subheadline | textarea | 200 chars |
| Primary CTA Text | text | 30 chars |
| Trust Badge Text | text | 50 chars |
| Footer Disclaimer | textarea | 500 chars |
| Primary Color | color picker | hex value |
| Accent Color | color picker | hex value |

**Status Controls:**
- If `draft`: "Publish" button available
- If `published`: "Disable" button available
- If `disabled`: "Republish" button available

**NOT Editable (locked):**
- Layout selection
- Sections enabled/disabled
- Component order
- Custom CSS

**Read-only Info Panel:**
- Template name and slug
- Base layout badge
- Current version
- Last updated timestamp

### 3.5 Apply Template Modal

**Flow:**
1. Brand selector dropdown (active brands only)
2. Shows current brand template (if any)
3. Shows new template being applied
4. Warning message: "This will replace [Brand Name]'s landing page. The change takes effect immediately."
5. Confirm / Cancel buttons

**On Confirm:**
1. Store current template as `previous_template_id/version`
2. Set new `active_template_id`
3. Set `applied_template_version` to current template version
4. Set `template_applied_at` to now()
5. Set `template_applied_by` to current admin
6. Log "applied" action to activity log with safe diff

### 3.6 Revert Template Modal

**Triggered from:** Brand row action or template actions

**Shows:**
- Current template name and version
- Previous template name and version
- Warning: "This will revert [Brand] to [Previous Template]. The change takes effect immediately."
- Confirm / Cancel buttons

**On Confirm:**
1. Swap current and previous template references
2. Update applied timestamps
3. Log "reverted" action to activity log

### 3.7 Activity Log Viewer

**Displayed as:** Tab on Templates page or collapsible section

**Columns:**
- Timestamp
- Action (Created, Updated, Published, Applied, Disabled, Reverted)
- Template (name + slug)
- Brand (for apply/revert actions)
- Admin (name or email)
- Changes (expandable, shows safe diff JSON)

**Filtering:**
- By action type
- By date range
- By template

---

## Phase 4: Template Seed Data (60 Templates)

### 4.1 Distribution Across Base Layouts

| Layout | Count | Slug Prefix | Initial Status |
|--------|-------|-------------|----------------|
| Hero Focused | 8 | hero- | published |
| Compliance Heavy | 8 | compliance- | published |
| Trust Signal Dense | 7 | trust- | published |
| Minimal Enterprise | 7 | minimal- | published |
| SDK Focused | 8 | sdk- | published |
| Global Reach | 7 | global- | published |
| Security First | 8 | security- | published |
| Conversion Optimized | 7 | conversion- | published |

### 4.2 Template Copy Guidelines

All copy must be:
- Enterprise-appropriate
- Carrier-safe (no spam trigger words)
- Compliant with SMS/10DLC regulations
- Professional tone
- Action-oriented but not aggressive
- Generic enough for multi-brand use

### 4.3 Example Templates

**Hero Focused Examples:**
- hero-enterprise-pro: "Enterprise-Grade Identity Verification"
- hero-startup-velocity: "Launch Faster with Verified Users"
- hero-scale-ready: "Built for Your Next Million Users"

**Compliance Heavy Examples:**
- compliance-hipaa-shield: "HIPAA-Compliant Identity Verification"
- compliance-soc2-certified: "SOC2 Type II Certified Platform"
- compliance-pci-ready: "PCI DSS Compliant Verification"

**Security First Examples:**
- security-zero-trust: "Zero-Trust Identity Architecture"
- security-encryption-grade: "Military-Grade Encryption Standard"
- security-cyber-shield: "Advanced Threat Protection"

---

## Phase 5: Routing and Navigation

### 5.1 Update AdminSidebar.tsx

Add new navigation item:

| Icon | Label | Path |
|------|-------|------|
| Layout | Templates | /admin/templates |

### 5.2 Update App.tsx

Add route under admin layout:
```text
<Route path="templates" element={<AdminTemplates />} />
```

---

## Phase 6: Custom Hooks

### 6.1 useTemplates Hook

| Function | Purpose |
|----------|---------|
| fetchTemplates(filters) | Get paginated list (metadata only) |
| getTemplateById(id) | Get full template for preview/edit |
| updateTemplate(id, updates) | Update editable fields (triggers version bump) |
| toggleTemplateStatus(id, status) | Change status (draft/published/disabled) |
| applyTemplateToBrand(templateId, brandId) | Associate with version snapshot |
| revertBrandTemplate(brandId) | Rollback to previous template |
| fetchActivityLog(filters) | Get audit trail |

### 6.2 useTemplatePreview Hook

- Lazy loading for preview modal
- React Query with 5-minute cache
- Only fetches when templateId is provided
- Returns loading, data, error states

---

## Phase 7: TypeScript Types

### 7.1 Template Interfaces

```text
// Base layout enum matching database
type LandingBaseLayout = 
  | 'hero_focused'
  | 'compliance_heavy'
  | 'trust_signal_dense'
  | 'minimal_enterprise'
  | 'sdk_focused'
  | 'global_reach'
  | 'security_first'
  | 'conversion_optimized';

type TemplateStatus = 'draft' | 'published' | 'disabled';

interface LandingTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  base_layout: LandingBaseLayout;
  version: number;
  status: TemplateStatus;
  editable_fields: EditableFields;
  default_copy: DefaultCopy;
  default_theme_overrides: ThemeOverrides;
  sections_enabled: SectionsEnabled;
  created_at: string;
  updated_at: string;
}

interface EditableFields {
  hero_headline: string;
  hero_subheadline: string;
  primary_cta_text: string;
  trust_badge_text: string;
  footer_disclaimer: string;
  primary_color: string;
  accent_color: string;
}

interface SectionsEnabled {
  hero: boolean;
  features: boolean;
  pricing: boolean;
  trust_badges: boolean;
  testimonials: boolean;
  compliance: boolean;
  footer: boolean;
}

interface TemplateActivityLog {
  id: string;
  template_id: string;
  template_slug: string;
  brand_id: string | null;
  action: 'created' | 'updated' | 'applied' | 'disabled' | 'published' | 'reverted';
  changes: Record<string, unknown>;
  performed_by: string;
  performed_at: string;
}
```

---

## Execution Order

### Step 1: Database Migration
1. Create enum types (landing_base_layout, template_status)
2. Create landing_templates table with all columns
3. Create template_activity_log table
4. Add new columns to brands table
5. Create version increment trigger
6. Create immutability protection triggers
7. Create safe diff logging function
8. Apply RLS policies

### Step 2: Seed 60 Templates
- Insert all 60 template records via database migration
- All seeded as "published" status

### Step 3: TypeScript Types
- Create src/types/templates.ts

### Step 4: Base Layouts
- Create 8 layout components in src/components/landing/layouts/
- Create LayoutRenderer.tsx

### Step 5: Custom Hooks
- Create useTemplates.ts
- Create useTemplatePreview.ts

### Step 6: Admin UI Components
- Create TemplatesTable.tsx
- Create TemplatePreviewModal.tsx
- Create TemplateEditorModal.tsx
- Create ApplyTemplateToBrandModal.tsx
- Create RevertTemplateModal.tsx
- Create TemplateActivityLog.tsx
- Create AdminTemplates.tsx page

### Step 7: Routing Updates
- Update AdminSidebar.tsx with Templates nav item
- Update App.tsx with /admin/templates route

### Step 8: Validation Testing
- Test admin-only access
- Test preview rendering
- Test template editing (version bumps)
- Test brand application (version snapshot)
- Test rollback flow
- Verify activity log entries
- Confirm no layout drift possible

---

## Security Implementation

### RBAC Enforcement
- All template operations require admin or super_admin role
- Uses existing is_admin() function for RLS policies
- No public access to templates table

### Immutability Guarantees
- Templates can be disabled but never deleted
- Activity log cannot be modified (trigger enforcement)
- Diffs only contain template field changes

### Safe Data Handling
- No PII in activity log diffs
- No secrets or tokens logged
- Only template-related changes recorded

---

## Acceptance Criteria Checklist

| Requirement | Implementation |
|-------------|----------------|
| 60 templates visible in /admin/templates | Seeded via database migration |
| Admin-only access | RLS policies + useAdminAuth hook |
| Version increments on edit | Database trigger |
| Apply snapshots version | applied_template_version column |
| Rollback works | previous_template_id/version + Revert modal |
| Activity log immutable | UPDATE/DELETE prevention triggers |
| No layout drift possible | Fixed React components, no custom CSS |
| No code changes for new templates | JSONB configuration + base layouts |
| Carrier-safe presentation | Controlled copy with character limits |

---

## Scalability Validation

**Simulated Scenarios:**

1. **50 brands onboarding weekly:**
   - No code changes required
   - Select template from dropdown, click Apply
   - Brand landing page updates immediately

2. **1 admin mistake + rollback:**
   - Click Revert button on brand
   - Previous template restored with one click
   - Action logged to audit trail

3. **Carrier audit review:**
   - Full audit trail in template_activity_log
   - All changes timestamped with admin attribution
   - Version history maintained on templates

**Confirmed:**
- Deterministic rendering (same config = same output)
- Full audit trace for compliance
- Zero developer intervention required

---

## Deliverables Summary

| Category | Count |
|----------|-------|
| Postgres enum types | 2 |
| Database tables | 2 new |
| Table extensions | 1 (brands) |
| Database triggers | 3 |
| Database functions | 2 |
| RLS policies | 5+ |
| Layout components | 8 + 1 renderer |
| Admin UI components | 6 |
| Custom hooks | 2 |
| Admin pages | 1 |
| Type definition files | 1 |
| Route updates | 2 files |
| Seed data records | 60 templates |

**Total: ~23 new files + 60 data records**

