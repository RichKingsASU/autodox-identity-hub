# Manual Testing Scripts - Domain Lifecycle (Netlify API Required)

## Prerequisites

1. **Netlify API Credentials Configured**:
   - `NETLIFY_ACCESS_TOKEN` in Supabase secrets
   - `NETLIFY_SITE_ID` in Supabase secrets

2. **Test Domain Available**:
   - A real domain you control for DNS configuration
   - Suggested: `qa-test.yourdomain.com`

---

## Architecture Note

Domain data is stored directly in the `brands` table (one domain per brand):
- `domain` - the custom domain
- `domain_status` - enum: pending, verifying, verified, provisioning_ssl, active, failed
- `domain_verification_token` - DNS verification token
- `domain_verified_at` - timestamp when DNS verified
- `ssl_status` - SSL certificate status
- `domain_error` - error message if failed
- `cloudflare_hostname_id` - Netlify domain ID

---

## Test 1: Add Domain via Edge Function

### Setup
```sql
-- Get an existing brand ID or create one
SELECT id, name, slug FROM public.brands LIMIT 5;
-- Note the brand_id for next steps
```

### Execute
```bash
# Call add-domain-to-netlify edge function
curl -X POST https://eecxwrxxtbaecbblpovl.supabase.co/functions/v1/add-domain-to-netlify \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_ID>",
    "domain": "qa-test.yourdomain.com"
  }'
```

### Expected Result
```json
{
  "success": true,
  "netlify_domain_id": "<NETLIFY_ID>",
  "dns_records": [
    {
      "type": "A",
      "hostname": "qa-test.yourdomain.com",
      "value": "75.2.60.5"
    }
  ]
}
```

### Verification
```sql
-- Check brand was updated with domain info
SELECT domain, domain_status, cloudflare_hostname_id 
FROM public.brands 
WHERE id = '<BRAND_ID>';
-- Expected: domain = 'qa-test.yourdomain.com', domain_status = 'verifying', cloudflare_hostname_id populated
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
nslookup qa-test.yourdomain.com

# Or use dig
dig qa-test.yourdomain.com
```

### Trigger Verification
```bash
curl -X POST https://eecxwrxxtbaecbblpovl.supabase.co/functions/v1/verify-domain \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_ID>"
  }'
```

### Expected Result
```json
{
  "success": true,
  "verified": true,
  "message": "Domain verified successfully"
}
```

### Verification
```sql
-- Check domain status updated
SELECT domain_status, domain_verified_at FROM public.brands 
WHERE id = '<BRAND_ID>';
-- Expected: domain_status = 'verified', domain_verified_at populated
```

---

## Test 3: SSL Provisioning

### Execute
```bash
# Check SSL status (repeat every 15-30 minutes until active)
curl -X POST https://eecxwrxxtbaecbblpovl.supabase.co/functions/v1/check-ssl-status \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_ID>"
  }'
```

### Expected Result (Initially)
```json
{
  "ssl_active": false,
  "ssl_state": "pending",
  "brand_id": "<BRAND_ID>",
  "domain": "qa-test.yourdomain.com"
}
```

### Expected Result (After 1-2 hours)
```json
{
  "ssl_active": true,
  "ssl_state": "issued",
  "brand_id": "<BRAND_ID>",
  "domain": "qa-test.yourdomain.com"
}
```

### Verification
```sql
-- Check domain is active
SELECT domain_status, ssl_status FROM public.brands 
WHERE id = '<BRAND_ID>';
-- Expected: domain_status = 'active', ssl_status = 'issued'
```

---

## Test 4: HTTPS Access and Brand Resolution

### Execute
```bash
# Test HTTPS access
curl -I https://qa-test.yourdomain.com

# Test brand resolution
curl -X POST https://eecxwrxxtbaecbblpovl.supabase.co/functions/v1/domain-resolver \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "qa-test.yourdomain.com"
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
  "brand_id": "<BRAND_ID>",
  "brand_name": "Brand Name",
  "brand_slug": "brand-slug",
  "template": {...},
  "settings": {...}
}
```

---

## Test 5: Failure Modes

### Test 5.1: Invalid Domain Format
```bash
curl -X POST https://eecxwrxxtbaecbblpovl.supabase.co/functions/v1/add-domain-to-netlify \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_ID>",
    "domain": "invalid domain with spaces"
  }'
```

**Expected**: `{"error": "Invalid domain format"}`

### Test 5.2: Reserved Domain
```bash
curl -X POST https://eecxwrxxtbaecbblpovl.supabase.co/functions/v1/add-domain-to-netlify \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_ID>",
    "domain": "test.netlify.app"
  }'
```

**Expected**: `{"error": "Reserved domain"}` or similar

### Test 5.3: Duplicate Domain
```bash
# Try to add same domain to another brand
curl -X POST https://eecxwrxxtbaecbblpovl.supabase.co/functions/v1/add-domain-to-netlify \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<ANOTHER_BRAND_ID>",
    "domain": "qa-test.yourdomain.com"
  }'
```

**Expected**: `{"error": "Domain already assigned to another brand"}`

---

## Cleanup

```sql
-- Remove test domain from brand
UPDATE public.brands 
SET 
  domain = NULL,
  domain_status = NULL,
  domain_verification_token = NULL,
  domain_verified_at = NULL,
  ssl_status = NULL,
  domain_error = NULL,
  cloudflare_hostname_id = NULL
WHERE id = '<BRAND_ID>';
```

---

## Test Summary Checklist

- [ ] Domain added successfully via edge function
- [ ] DNS records provided correctly
- [ ] DNS verification works after configuration
- [ ] SSL provisioning completes successfully
- [ ] HTTPS access works with valid certificate
- [ ] Brand resolution returns correct brand data
- [ ] Invalid domains rejected
- [ ] Reserved domains blocked
- [ ] Duplicate domains prevented
- [ ] State transitions follow expected flow
