
# Production-Grade Resend Email System and Domain Admin Portal

## Overview

This plan transforms the email infrastructure and domain management into a production-ready, multi-tenant system with dynamic configuration, comprehensive error logging, and polished UI components.

---

## Phase 1: Database Schema Updates

### 1.1 Create `brand_email_settings` Table
Store per-brand email configuration for dynamic sender addresses and API keys.

```text
brand_email_settings
├── id (uuid, PK)
├── brand_id (uuid, FK -> brands)
├── from_name (text) - e.g., "Acme Corp"
├── from_email (text) - e.g., "noreply@acme.com"
├── reply_to_email (text, nullable)
├── sending_domain (text, nullable) - Resend verified domain
├── sending_domain_status (text) - pending/verified/failed
├── custom_api_key (text, encrypted, nullable) - For brands with own Resend account
├── created_at (timestamptz)
├── updated_at (timestamptz)
```

### 1.2 Create `debug_logs` Table
Centralized error tracking for all edge functions.

```text
debug_logs
├── id (uuid, PK)
├── function_name (text) - Edge function identifier
├── error_type (text) - error/warning/info
├── error_message (text)
├── error_stack (text, nullable)
├── request_payload (jsonb) - Sanitized request data
├── response_status (integer)
├── brand_id (uuid, nullable)
├── user_id (uuid, nullable)
├── created_at (timestamptz)
```

### 1.3 Create `email_logs` Table (Referenced but Missing)
Track all email sends for audit and debugging.

```text
email_logs
├── id (uuid, PK)
├── brand_id (uuid, nullable)
├── to_email (text)
├── from_email (text)
├── subject (text)
├── template_key (text, nullable)
├── resend_id (text, nullable)
├── status (text) - queued/sent/delivered/failed/bounced
├── error_message (text, nullable)
├── created_at (timestamptz)
```

### 1.4 Add `last_notified_at` Columns
Update these tables with notification tracking:
- `applications` - Track when status change notifications were sent
- `contact_submissions` - Track confirmation email timestamps
- `brands` - Track domain status notification timestamps

---

## Phase 2: Dynamic Email Edge Function

### 2.1 Refactor `send-email` Function

Replace the hardcoded sender with dynamic brand-based configuration:

```text
┌─────────────────────────────────────────────────────────┐
│                    send-email (v2)                       │
├─────────────────────────────────────────────────────────┤
│  1. Parse request (to, subject, html, brand_id)         │
│  2. Load brand email settings from DB                   │
│     - If brand_id: fetch brand_email_settings           │
│     - Fallback: use system defaults                     │
│  3. Resolve API key (brand custom or system RESEND_KEY) │
│  4. Send via Resend API with dynamic "from" address     │
│  5. Log to email_logs table                             │
│  6. On error: write to debug_logs, return clean error   │
└─────────────────────────────────────────────────────────┘
```

Key changes:
- Accept optional `brand_id` parameter
- Query `brand_email_settings` for sender configuration
- Support per-brand Resend API keys (encrypted)
- Global try/catch with debug_logs persistence
- Return standardized error responses

### 2.2 Update All Email-Sending Functions

Modify these to use the new dynamic system:
- `send-contact-notification` - Use brand settings for sender
- `send-signup-verification` - Dynamic branding
- `send-password-reset` (existing) - Already uses Resend
- `send-brand-event-email` - Pass brand_id for dynamic sender
- `notify-application-status` - Add notification tracking

---

## Phase 3: Domain Manager UI Enhancement

### 3.1 New Dedicated Domain Manager Page (`/admin/domains`)

Create a premium, standalone domain management dashboard:

```text
┌─────────────────────────────────────────────────────────┐
│  Domain Manager                              [+ Add Domain]
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🌐 acme.com                           [Active] ✓  │  │
│  │    Brand: Acme Corp  |  SSL: Issued  |  Live     │  │
│  │    [Visit] [Configure] [Remove]                   │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🌐 beta.startup.io              [Pending DNS] ⏳  │  │
│  │    Brand: Startup Inc  |  Awaiting verification   │  │
│  │    [View DNS Records] [Verify Now] [Remove]       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Enhanced `BrandDomainTab` Component

Improvements:
- **Loading Skeletons**: Shimmer placeholders during data fetch
- **Optimistic Updates**: Immediate UI feedback before API response
- **Auto-Refresh Status Loop**: Poll verification status every 30s when pending
- **Progress Stepper**: Visual Pending -> Verified -> SSL -> Active flow
- **Copy DNS Records**: One-click copy for all required records

### 3.3 Domain Status Stepper Component

```text
Domain Lifecycle Visualization:

[1. Configure] ──> [2. Add DNS] ──> [3. Verify] ──> [4. SSL] ──> [5. Active]
     ✓               Current           ⏳            ○            ○
```

---

## Phase 4: Resilience and Error Handling

### 4.1 Optimistic UI Pattern

Implement across all domain/brand operations:

```typescript
// Example pattern for domain save
const handleSave = async () => {
  // 1. Optimistic update
  setDomainState(prev => ({ ...prev, domain: newDomain, domain_status: 'pending' }));
  
  // 2. API call
  const result = await setDomain(newDomain);
  
  // 3. On failure: revert + toast
  if (!result.success) {
    setDomainState(previousState);
    toast.error(result.error);
  }
};
```

### 4.2 Loading Skeleton Components

Create reusable skeletons for:
- Domain card skeleton
- DNS records skeleton
- Status badge skeleton
- Table row skeleton

### 4.3 Error Boundary Wrapper

Wrap admin pages with error boundaries to prevent full-page crashes:

```typescript
<ErrorBoundary fallback={<AdminErrorFallback />}>
  <DomainManager />
</ErrorBoundary>
```

### 4.4 Toast Error System

Standardize error toast format:
- Icon: AlertTriangle for warnings, XCircle for errors
- Title: Brief error description
- Action: Optional retry button
- Duration: Errors persist until dismissed

---

## Phase 5: Edge Function Error Logging

### 5.1 Create Shared Error Logger Utility

```typescript
// Shared error logging function for all edge functions
async function logError(supabase, context: {
  function_name: string;
  error: Error;
  request_payload?: object;
  brand_id?: string;
  user_id?: string;
}) {
  await supabase.from('debug_logs').insert({
    function_name: context.function_name,
    error_type: 'error',
    error_message: context.error.message,
    error_stack: context.error.stack,
    request_payload: sanitizePayload(context.request_payload),
    brand_id: context.brand_id,
    user_id: context.user_id,
  });
}
```

### 5.2 Update All Edge Functions

Wrap each function with:
```typescript
try {
  // Existing logic
} catch (error) {
  await logError(supabase, { function_name: 'send-email', error, ... });
  return new Response(
    JSON.stringify({ success: false, error: 'Email delivery failed' }),
    { status: 500 }
  );
}
```

---

## Files to Create

| File | Description |
|------|-------------|
| `src/pages/admin/AdminDomains.tsx` | Dedicated domain manager page |
| `src/components/admin/DomainCard.tsx` | Individual domain card with status |
| `src/components/admin/DomainStatusStepper.tsx` | Visual lifecycle stepper |
| `src/components/admin/DomainSkeletons.tsx` | Loading state components |
| `src/components/admin/EmailSettingsTab.tsx` | Per-brand email configuration |
| `src/hooks/useDomainManager.ts` | Domain lifecycle management hook |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/send-email/index.ts` | Dynamic brand config, error logging |
| `supabase/functions/send-contact-notification/index.ts` | Remove hardcoded sender |
| `supabase/functions/send-brand-event-email/index.ts` | Pass brand context |
| `src/components/admin/BrandDomainTab.tsx` | Add skeletons, optimistic updates |
| `src/hooks/useBrandDomain.ts` | Add auto-refresh, error recovery |
| `src/pages/admin/AdminLayout.tsx` | Add Domains nav item |
| `src/components/admin/EditBrandModal.tsx` | Add Email Settings tab |

## Database Migrations

1. Create `brand_email_settings` table with RLS
2. Create `debug_logs` table with admin-only RLS
3. Create `email_logs` table with RLS
4. Add `last_notified_at` to `applications`, `contact_submissions`, `brands`

---

## Implementation Order

1. **Database First**: Create all new tables and columns
2. **Email System**: Refactor `send-email` to be dynamic
3. **Error Logging**: Add debug_logs integration to all functions
4. **UI Components**: Build skeletons and domain cards
5. **Domain Manager Page**: Assemble the new admin page
6. **Polish**: Optimistic updates, auto-refresh loops, final testing

---

## Security Considerations

- `custom_api_key` in `brand_email_settings` should only be readable by service role
- `debug_logs` visible only to admins via RLS
- Sanitize all request payloads before logging (remove passwords, tokens)
- Rate limit domain verification attempts

---

## Expected Outcomes

- Zero hardcoded email addresses in production code
- Per-brand sender customization
- Complete audit trail for all emails and errors
- Premium domain management experience
- Resilient UI that never crashes on API failures
