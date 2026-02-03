
# DNS Sync and Integration Status Indicators

## Overview
Add visual indicators throughout the admin interface to show integration health and DNS sync status, providing administrators with at-a-glance visibility into system connectivity.

## Components to Create

### 1. Integration Status Panel (`IntegrationStatusPanel.tsx`)
A reusable component displaying the health status of all external integrations:
- **Netlify** (Domain/SSL management) - Uses existing health check endpoint
- **Resend** (Email delivery) - New health check endpoint
- **Database** (Lovable Cloud) - Connection status
- Visual states: Connected (green), Checking (loading), Disconnected (red), Warning (amber)

### 2. DNS Sync Status Indicator
Add to BrandDomainTab showing:
- Source of DNS configuration (Live API vs Fallback)
- Last sync timestamp
- Animated sync icon when fetching
- Warning when using fallback data

### 3. Integration Status Hook (`useIntegrationStatus.ts`)
Centralized hook to fetch and cache integration statuses:
- Netlify connection status
- Resend API connectivity
- Database health
- Auto-refresh on interval (optional)

## Implementation Details

### Integration Status Panel Design
```text
┌─────────────────────────────────────────────────────────────┐
│  Integration Status                                         │
├─────────────────────────────────────────────────────────────┤
│  ● Netlify         Connected    identitybrandhub           │
│  ● Email (Resend)  Connected    API Key configured         │
│  ● Database        Connected    Lovable Cloud              │
└─────────────────────────────────────────────────────────────┘
```

### DNS Sync Indicator Design  
```text
┌──────────────────────────────────────┐
│  DNS Configuration                   │
│  ↻ Synced from Netlify API          │
│  Last updated: 2 min ago             │
└──────────────────────────────────────┘
```

Or when using fallback:
```text
┌──────────────────────────────────────┐
│  DNS Configuration              ⚠   │
│  Using cached configuration          │
│  Netlify API unavailable             │
└──────────────────────────────────────┘
```

## Files to Create

| File | Description |
|------|-------------|
| `src/components/admin/IntegrationStatusPanel.tsx` | Main integration status display component |
| `src/hooks/useIntegrationStatus.ts` | Hook for fetching all integration statuses |
| `supabase/functions/resend-health-check/index.ts` | New edge function to verify Resend API connectivity |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/BrandDomainTab.tsx` | Add DNS sync status indicator with source and timestamp |
| `src/hooks/useDNSRequirements.ts` | Add lastSynced timestamp to track when data was fetched |
| `src/components/admin/AdminOverview.tsx` | Add IntegrationStatusPanel below uptime banner |
| `src/pages/admin/AdminSettings.tsx` | Add Integrations tab with detailed status panel |
| `supabase/config.toml` | Register new resend-health-check function |

## Visual Indicators

### Status Icons
- **Connected**: Green checkmark with pulse animation
- **Checking**: Spinning loader
- **Disconnected**: Red X icon
- **Warning**: Amber triangle (e.g., using fallback)

### DNS Sync Badge
- **Live API**: `↻ Synced` - Green badge with refresh icon
- **Fallback**: `⚠ Cached` - Amber badge with warning icon
- **Loading**: Skeleton/spinner

## New Edge Function: resend-health-check

Simple health check that verifies:
1. RESEND_API_KEY is configured
2. API responds successfully (test endpoint)

Returns:
```json
{
  "connected": true,
  "message": "Resend API operational"
}
```

## Admin Overview Integration

Add to the existing "Global Uptime Banner" section, showing integration health alongside platform metrics:
- Quick status pills for each integration
- Expandable to show details
- Link to full Integrations settings page

## Technical Notes

- All status checks use existing edge functions where possible
- Caching prevents excessive API calls (1-minute cache)
- Graceful degradation when services unavailable
- No sensitive data exposed (API keys, tokens stay server-side)
