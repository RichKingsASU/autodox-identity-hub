# Manual Testing Scripts - Domain Lifecycle (Netlify API Required)

## Prerequisites

1. **Netlify API Credentials Configured**:
   - `NETLIFY_ACCESS_TOKEN` in Supabase secrets
   - `NETLIFY_SITE_ID` in Supabase secrets

2. **Test Domains Available**:
   - 3 real domains you control for DNS configuration
   - Suggested: `qa-alpha.yourdomain.com`, `qa-beta.yourdomain.com`, `qa-gamma.yourdomain.com`

---

## Test 1: Add Domain via Edge Function

### Setup
```sql
-- Create test brand
INSERT INTO public.brands (name, slug, owner_user_id)
VALUES ('QA Alpha', 'qa-alpha', auth.uid())
RETURNING id;
-- Note the brand_id for next steps
```

### Execute
```bash
# Call add-domain-to-netlify edge function
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/add-domain-to-netlify \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_ID>",
    "domain": "qa-alpha.yourdomain.com",
    "is_primary": true
  }'
```

### Expected Result
```json
{
  "success": true,
  "domain_id": "<UUID>",
  "netlify_domain_id": "<NETLIFY_ID>",
  "dns_records": [
    {
      "type": "A",
      "hostname": "qa-alpha.yourdomain.com",
      "value": "75.2.60.5"
    }
  ]
}
```

### Verification
```sql
-- Check domain was created
SELECT * FROM public.domains WHERE domain = 'qa-alpha.yourdomain.com';
-- Expected: status = 'verifying', netlify_domain_id populated

-- Check event was logged
SELECT * FROM public.domain_events 
WHERE domain_id = (SELECT id FROM public.domains WHERE domain = 'qa-alpha.yourdomain.com')
ORDER BY created_at DESC;
-- Expected: event_type = 'netlify_added'
```

---

## Test 2: DNS Configuration and Verification

### Manual Step
1. Log into your DNS provider
2. Add the DNS records returned from Test 1
3. Wait 5-10 minutes for propagation

### Verify DNS Propagation
```bash
# Check DNS resolution
nslookup qa-alpha.yourdomain.com

# Or use dig
dig qa-alpha.yourdomain.com
```

### Trigger Verification
```bash
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/verify-domain-dns \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "domain_id": "<DOMAIN_ID>"
  }'
```

### Expected Result
```json
{
  "success": true,
  "verified": true,
  "dns_zone_id": "<ZONE_ID>"
}
```

### Verification
```sql
-- Check domain status updated
SELECT status, verified_at FROM public.domains 
WHERE domain = 'qa-alpha.yourdomain.com';
-- Expected: status = 'verified', verified_at populated

-- Check event logged
SELECT * FROM public.domain_events 
WHERE domain_id = (SELECT id FROM public.domains WHERE domain = 'qa-alpha.yourdomain.com')
AND event_type = 'dns_verified';
-- Expected: 1 row
```

---

## Test 3: SSL Provisioning

### Execute
```bash
# Check SSL status (repeat every 15-30 minutes until active)
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/check-ssl-status \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "domain_id": "<DOMAIN_ID>"
  }'
```

### Expected Result (Initially)
```json
{
  "success": true,
  "ssl_state": "pending"
}
```

### Expected Result (After 1-2 hours)
```json
{
  "success": true,
  "ssl_state": "issued",
  "status": "active"
}
```

### Verification
```sql
-- Check domain is active
SELECT status, ssl_status FROM public.domains 
WHERE domain = 'qa-alpha.yourdomain.com';
-- Expected: status = 'active', ssl_status = 'issued'

-- Check events logged
SELECT event_type, created_at FROM public.domain_events 
WHERE domain_id = (SELECT id FROM public.domains WHERE domain = 'qa-alpha.yourdomain.com')
ORDER BY created_at ASC;
-- Expected sequence: created, netlify_added, dns_verified, ssl_provisioning, activated
```

---

## Test 4: HTTPS Access and Brand Resolution

### Execute
```bash
# Test HTTPS access
curl -I https://qa-alpha.yourdomain.com

# Test brand resolution
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/domain-resolver \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "qa-alpha.yourdomain.com"
  }'
```

### Expected Result (HTTPS)
```
HTTP/2 200
...
(SSL certificate valid, no errors)
```

### Expected Result (Brand Resolution)
```json
{
  "success": true,
  "brand": {
    "id": "<BRAND_ID>",
    "name": "QA Alpha",
    "slug": "qa-alpha",
    "settings": {...},
    "template": {...}
  }
}
```

---

## Test 5: Secondary Domain (Non-Primary)

### Execute
```bash
# Add secondary domain to same brand
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/add-domain-to-netlify \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_ID>",
    "domain": "qa-alpha-secondary.yourdomain.com",
    "is_primary": false
  }'
```

### Verification
```sql
-- Check both domains exist
SELECT domain, is_primary, status FROM public.domains 
WHERE brand_id = '<BRAND_ID>'
ORDER BY is_primary DESC;
-- Expected: 2 rows, one with is_primary = true, one with is_primary = false

-- Verify only one primary
SELECT COUNT(*) FROM public.domains 
WHERE brand_id = '<BRAND_ID>' AND is_primary = true;
-- Expected: 1
```

---

## Test 6: Failure Modes

### Test 6.1: Invalid Domain Format
```bash
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/add-domain-to-netlify \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_ID>",
    "domain": "invalid domain with spaces",
    "is_primary": false
  }'
```

**Expected**: `{"success": false, "error": "Invalid domain format"}`

### Test 6.2: Reserved Domain
```bash
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/add-domain-to-netlify \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_ID>",
    "domain": "agents-institute.com",
    "is_primary": false
  }'
```

**Expected**: `{"success": false, "error": "Reserved domain"}`

### Test 6.3: Duplicate Domain
```bash
# Try to add same domain twice
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/add-domain-to-netlify \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_ID>",
    "domain": "qa-alpha.yourdomain.com",
    "is_primary": false
  }'
```

**Expected**: `{"success": false, "error": "Domain already exists"}`

---

## Cleanup

```sql
-- Remove test domains
DELETE FROM public.domain_events 
WHERE domain_id IN (SELECT id FROM public.domains WHERE brand_id = '<BRAND_ID>');

DELETE FROM public.domains WHERE brand_id = '<BRAND_ID>');

DELETE FROM public.brands WHERE id = '<BRAND_ID>';
```

---

## Test Summary Checklist

- [ ] Domain added successfully via edge function
- [ ] DNS records provided correctly
- [ ] DNS verification works after configuration
- [ ] SSL provisioning completes successfully
- [ ] HTTPS access works with valid certificate
- [ ] Brand resolution returns correct brand
- [ ] Secondary domain routing works
- [ ] Primary domain remains unchanged
- [ ] Invalid domains rejected
- [ ] Reserved domains blocked
- [ ] Duplicate domains prevented
- [ ] All events logged correctly
- [ ] State transitions follow expected flow
