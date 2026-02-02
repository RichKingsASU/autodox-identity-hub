# Manual Testing Scripts - Email System (Resend API Required)

## Prerequisites

1. **Resend API Key Configured**:
   - `RESEND_API_KEY` in Supabase secrets
   - Get from: https://resend.com/api-keys

2. **Test Email Addresses**:
   - 3 real email addresses you control
   - Suggested: Use + addressing (e.g., yourname+qa1@gmail.com)

---

## Test 1: Configure Brand Email Settings

### Setup
```sql
-- Create test brand (if not already created)
INSERT INTO public.brands (name, slug, owner_user_id)
VALUES ('QA Email Test', 'qa-email-test', auth.uid())
RETURNING id;
-- Note the brand_id
```

### Configure Email Settings
```sql
-- Insert email settings
INSERT INTO public.brand_email_settings (
  brand_id,
  from_name,
  from_email,
  reply_to,
  is_active
)
VALUES (
  '<BRAND_ID>',
  'QA Test Brand',
  'notifications@agents-institute.com',
  'qa-test@yourdomain.com',
  true
);
```

### Verification
```sql
-- Check settings created
SELECT * FROM public.brand_email_settings WHERE brand_id = '<BRAND_ID>';
-- Expected: 1 row with correct values

-- Test get_brand_email_config function
SELECT * FROM get_brand_email_config('<BRAND_ID>');
-- Expected: Returns brand details + email settings
```

---

## Test 2: Send Test Email

### Execute
```bash
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_ID>",
    "template_key": "test_email",
    "recipient_email": "your-email@example.com",
    "template_data": {
      "test_message": "This is a QA test email!",
      "sent_at": "2026-02-01T20:00:00Z"
    }
  }'
```

### Expected Result
```json
{
  "success": true,
  "email_id": "re_<resend_id>",
  "message": "Email sent successfully"
}
```

### Verification

**Check Email Received**:
- Subject: "Test Email from QA Test Brand"
- From: "QA Test Brand <notifications@agents-institute.com>"
- Reply-To: "qa-test@yourdomain.com"
- Body contains: "This is a QA test email!"
- Brand styling applied (if logo/colors configured)

**Check Database**:
```sql
-- Check email event logged
SELECT * FROM public.email_events 
WHERE brand_id = '<BRAND_ID>'
ORDER BY sent_at DESC
LIMIT 1;
-- Expected: status = 'sent', resend_email_id populated, template_key = 'test_email'
```

---

## Test 3: Send Domain Activated Email

### Execute
```bash
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/send-brand-event-email \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "domain_activated",
    "brand_id": "<BRAND_ID>",
    "recipient_email": "your-email@example.com",
    "payload": {
      "domain_name": "qa-test.yourdomain.com",
      "activated_at": "2026-02-01T20:30:00Z"
    }
  }'
```

### Expected Result
```json
{
  "success": true,
  "event_type": "domain_activated",
  "template_key": "domain_activated",
  "email_id": "re_<resend_id>"
}
```

### Verification

**Check Email Received**:
- Subject: "Your domain qa-test.yourdomain.com is now active!"
- Body contains: "Your custom domain qa-test.yourdomain.com has been successfully activated"
- SSL confirmation message present
- Link to domain present

**Check Database**:
```sql
SELECT * FROM public.email_events 
WHERE brand_id = '<BRAND_ID>' AND template_key = 'domain_activated'
ORDER BY sent_at DESC
LIMIT 1;
-- Expected: status = 'sent'
```

---

## Test 4: Send Brand Created Email

### Execute
```bash
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/send-brand-event-email \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "brand_created",
    "brand_id": "<BRAND_ID>",
    "recipient_email": "your-email@example.com",
    "payload": {
      "admin_url": "https://agents-institute.com/admin"
    }
  }'
```

### Verification

**Check Email Received**:
- Subject: "Welcome to QA Test Brand!"
- Body contains: "Your brand QA Test Brand has been successfully created"
- Next steps checklist present
- Link to admin portal present

---

## Test 5: Failure Mode - Missing Email Settings

### Setup
```sql
-- Create brand without email settings
INSERT INTO public.brands (name, slug, owner_user_id)
VALUES ('QA No Email', 'qa-no-email', auth.uid())
RETURNING id;
-- Note the brand_id
```

### Execute
```bash
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_ID_WITHOUT_EMAIL>",
    "template_key": "test_email",
    "recipient_email": "your-email@example.com",
    "template_data": {}
  }'
```

### Expected Result
```json
{
  "success": false,
  "error": "Brand email settings not configured"
}
```

### Verification
```sql
-- Check NO email event created
SELECT COUNT(*) FROM public.email_events 
WHERE brand_id = '<BRAND_ID_WITHOUT_EMAIL>';
-- Expected: 0

-- Or check failed event logged
SELECT * FROM public.email_events 
WHERE brand_id = '<BRAND_ID_WITHOUT_EMAIL>' AND status = 'failed';
-- Expected: 1 row with error_message
```

---

## Test 6: Failure Mode - Inactive Email Config

### Setup
```sql
-- Deactivate email settings
UPDATE public.brand_email_settings
SET is_active = false
WHERE brand_id = '<BRAND_ID>';
```

### Execute
```bash
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_ID>",
    "template_key": "test_email",
    "recipient_email": "your-email@example.com",
    "template_data": {}
  }'
```

### Expected Result
```json
{
  "success": false,
  "error": "Brand email sending is disabled"
}
```

### Cleanup
```sql
-- Reactivate for other tests
UPDATE public.brand_email_settings
SET is_active = true
WHERE brand_id = '<BRAND_ID>';
```

---

## Test 7: Failure Mode - Invalid Recipient

### Execute
```bash
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_ID>",
    "template_key": "test_email",
    "recipient_email": "not-an-email",
    "template_data": {}
  }'
```

### Expected Result
```json
{
  "success": false,
  "error": "Invalid recipient email format"
}
```

---

## Test 8: Failure Mode - Missing Template

### Execute
```bash
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type": "application/json" \
  -d '{
    "brand_id": "<BRAND_ID>",
    "template_key": "nonexistent_template",
    "recipient_email": "your-email@example.com",
    "template_data": {}
  }'
```

### Expected Result
```json
{
  "success": false,
  "error": "Email template 'nonexistent_template' not found"
}
```

---

## Test 9: Multi-Brand Isolation

### Setup
```sql
-- Create second test brand
INSERT INTO public.brands (name, slug, owner_user_id)
VALUES ('QA Brand B', 'qa-brand-b', auth.uid())
RETURNING id;
-- Note brand_b_id

-- Configure email for Brand B
INSERT INTO public.brand_email_settings (
  brand_id,
  from_name,
  from_email,
  reply_to,
  is_active
)
VALUES (
  '<BRAND_B_ID>',
  'QA Brand B',
  'notifications@agents-institute.com',
  'brandb@yourdomain.com',
  true
);
```

### Execute
```bash
# Send email from Brand A
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_A_ID>",
    "template_key": "test_email",
    "recipient_email": "your-email+branda@example.com",
    "template_data": {"test_message": "From Brand A"}
  }'

# Send email from Brand B
curl -X POST https://iqluzpzttzoaybbjvtsr.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "<BRAND_B_ID>",
    "template_key": "test_email",
    "recipient_email": "your-email+brandb@example.com",
    "template_data": {"test_message": "From Brand B"}
  }'
```

### Verification

**Check Emails Received**:
- Email 1: From "QA Test Brand", Reply-To "qa-test@yourdomain.com", contains "From Brand A"
- Email 2: From "QA Brand B", Reply-To "brandb@yourdomain.com", contains "From Brand B"
- **No cross-contamination of branding**

**Check Database**:
```sql
-- Check events are correctly attributed
SELECT brand_id, recipient, template_key, status 
FROM public.email_events 
WHERE brand_id IN ('<BRAND_A_ID>', '<BRAND_B_ID>')
ORDER BY sent_at DESC;
-- Expected: 2 rows, each with correct brand_id
```

---

## Test 10: Email Audit Log Immutability

### Execute
```sql
-- Try to update email event (should fail)
UPDATE public.email_events
SET status = 'modified'
WHERE brand_id = '<BRAND_ID>'
LIMIT 1;
-- Expected: ERROR - insufficient_privilege

-- Try to delete email event (should fail)
DELETE FROM public.email_events
WHERE brand_id = '<BRAND_ID>'
LIMIT 1;
-- Expected: ERROR - insufficient_privilege
```

---

## Cleanup

```sql
-- Remove test data
DELETE FROM public.email_events WHERE brand_id IN ('<BRAND_ID>', '<BRAND_B_ID>');
DELETE FROM public.brand_email_settings WHERE brand_id IN ('<BRAND_ID>', '<BRAND_B_ID>');
DELETE FROM public.brands WHERE id IN ('<BRAND_ID>', '<BRAND_B_ID>');
```

---

## Test Summary Checklist

- [ ] Email settings configured successfully
- [ ] Test email sent and received
- [ ] Domain activated email sent and received
- [ ] Brand created email sent and received
- [ ] Correct branding applied (from name, reply-to)
- [ ] Missing email settings blocked send
- [ ] Inactive config blocked send
- [ ] Invalid recipient rejected
- [ ] Missing template rejected
- [ ] Multi-brand isolation verified
- [ ] No cross-brand leakage
- [ ] Email events logged correctly
- [ ] Email events immutable (no updates/deletes)
- [ ] All failures logged with error messages
