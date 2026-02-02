-- =============================================================================
-- Multi-Brand Email Delivery System Migration
-- Purpose: Add email delivery infrastructure using Resend
-- Date: 2026-02-01
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1: Create brand_email_settings Table
-- -----------------------------------------------------------------------------

CREATE TABLE public.brand_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL UNIQUE REFERENCES public.brands(id) ON DELETE CASCADE,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  reply_to TEXT,
  sending_domain TEXT, -- Custom domain for sending (e.g., mail.brand.com)
  sending_domain_status TEXT CHECK (sending_domain_status IN ('pending', 'verified', 'failed')),
  sending_domain_dns_records JSONB, -- SPF/DKIM/DMARC records from Resend
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_brand_email_settings_brand_id ON public.brand_email_settings(brand_id);
CREATE INDEX idx_brand_email_settings_is_active ON public.brand_email_settings(is_active) WHERE is_active = true;
CREATE INDEX idx_brand_email_settings_sending_domain ON public.brand_email_settings(sending_domain) WHERE sending_domain IS NOT NULL;

-- Add comments
COMMENT ON TABLE public.brand_email_settings IS 'Per-brand email configuration including sending domains and identity';
COMMENT ON COLUMN public.brand_email_settings.sending_domain IS 'Custom domain for email sending (requires DNS verification)';
COMMENT ON COLUMN public.brand_email_settings.sending_domain_dns_records IS 'DNS records (SPF/DKIM/DMARC) provided by Resend for domain verification';

-- -----------------------------------------------------------------------------
-- PART 2: Create email_templates Table
-- -----------------------------------------------------------------------------

CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL, -- Supports {{variables}}
  html_template TEXT NOT NULL, -- HTML with {{variables}}
  text_template TEXT NOT NULL, -- Plain text with {{variables}}
  required_variables JSONB NOT NULL DEFAULT '[]', -- Array of required variable names
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE UNIQUE INDEX idx_email_templates_template_key ON public.email_templates(template_key);
CREATE INDEX idx_email_templates_created_at ON public.email_templates(created_at DESC);

-- Add comments
COMMENT ON TABLE public.email_templates IS 'Shared email templates with variable substitution for all brands';
COMMENT ON COLUMN public.email_templates.template_key IS 'Unique identifier for template (e.g., domain_activated, brand_created)';
COMMENT ON COLUMN public.email_templates.required_variables IS 'JSON array of variable names required for this template';

-- -----------------------------------------------------------------------------
-- PART 3: Create email_events Table (Immutable Audit Log)
-- -----------------------------------------------------------------------------

CREATE TABLE public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  template_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  resend_email_id TEXT, -- Resend's email ID for tracking
  error_message TEXT,
  metadata JSONB DEFAULT '{}', -- Additional context
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_email_events_brand_id ON public.email_events(brand_id);
CREATE INDEX idx_email_events_recipient ON public.email_events(recipient);
CREATE INDEX idx_email_events_sent_at ON public.email_events(sent_at DESC);
CREATE INDEX idx_email_events_status ON public.email_events(status);
CREATE INDEX idx_email_events_template_key ON public.email_events(template_key);

-- Add comments
COMMENT ON TABLE public.email_events IS 'Immutable audit log of all email sends (no updates or deletes allowed)';
COMMENT ON COLUMN public.email_events.resend_email_id IS 'Resend email ID for tracking delivery status';

-- -----------------------------------------------------------------------------
-- PART 4: Helper Functions
-- -----------------------------------------------------------------------------

-- Function to get brand email settings with brand details
CREATE OR REPLACE FUNCTION public.get_brand_email_config(target_brand_id UUID)
RETURNS TABLE (
  brand_id UUID,
  brand_name TEXT,
  brand_logo TEXT,
  brand_color TEXT,
  brand_domain TEXT,
  from_name TEXT,
  from_email TEXT,
  reply_to TEXT,
  sending_domain TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id AS brand_id,
    b.name AS brand_name,
    COALESCE(b.settings->>'logo_url', '') AS brand_logo,
    COALESCE(b.settings->>'primary_color', '#8B5CF6') AS brand_color,
    d.domain AS brand_domain,
    bes.from_name,
    bes.from_email,
    bes.reply_to,
    bes.sending_domain,
    bes.is_active
  FROM public.brands b
  INNER JOIN public.brand_email_settings bes ON b.id = bes.brand_id
  LEFT JOIN public.domains d ON b.id = d.brand_id AND d.is_primary = true AND d.status = 'active'
  WHERE b.id = target_brand_id
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_brand_email_config IS 'Retrieves complete email configuration with brand details for email sending';

-- -----------------------------------------------------------------------------
-- PART 5: Triggers
-- -----------------------------------------------------------------------------

-- Update updated_at on brand_email_settings
CREATE TRIGGER update_brand_email_settings_updated_at
  BEFORE UPDATE ON public.brand_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at on email_templates
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- PART 6: Enable Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.brand_email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- PART 7: RLS Policies - brand_email_settings
-- -----------------------------------------------------------------------------

-- Admins can manage all settings
CREATE POLICY "Admins can manage brand email settings"
ON public.brand_email_settings FOR ALL
USING (public.is_admin(auth.uid()));

-- Brand owners can view their settings
CREATE POLICY "Brand owners can view their email settings"
ON public.brand_email_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = brand_email_settings.brand_id
    AND brands.owner_user_id = auth.uid()
  )
);

-- Service role can read all (for edge functions)
CREATE POLICY "Service role can read email settings"
ON public.brand_email_settings FOR SELECT
USING (true); -- Service role bypasses RLS anyway, but explicit for clarity

-- -----------------------------------------------------------------------------
-- PART 8: RLS Policies - email_templates
-- -----------------------------------------------------------------------------

-- Admins can manage templates
CREATE POLICY "Admins can manage email templates"
ON public.email_templates FOR ALL
USING (public.is_admin(auth.uid()));

-- Service role can read templates (for edge functions)
CREATE POLICY "Service role can read email templates"
ON public.email_templates FOR SELECT
USING (true);

-- -----------------------------------------------------------------------------
-- PART 9: RLS Policies - email_events
-- -----------------------------------------------------------------------------

-- Admins can view all events
CREATE POLICY "Admins can view email events"
ON public.email_events FOR SELECT
USING (public.is_admin(auth.uid()));

-- System can insert events (via service role)
CREATE POLICY "System can insert email events"
ON public.email_events FOR INSERT
WITH CHECK (true);

-- No updates allowed (immutable)
CREATE POLICY "Email events are immutable"
ON public.email_events FOR UPDATE
USING (false);

-- No deletes allowed (immutable)
CREATE POLICY "Email events cannot be deleted"
ON public.email_events FOR DELETE
USING (false);

-- Brand owners can view their email events
CREATE POLICY "Brand owners can view their email events"
ON public.email_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = email_events.brand_id
    AND brands.owner_user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- PART 10: Seed Email Templates
-- -----------------------------------------------------------------------------

INSERT INTO public.email_templates (template_key, name, description, subject, html_template, text_template, required_variables)
VALUES
-- Domain Activated Template
('domain_activated', 'Domain Activated', 'Sent when a custom domain becomes active', 
'Your domain {{domain_name}} is now active!',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: {{brand_color}}; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .logo { max-width: 200px; height: auto; margin-bottom: 10px; }
    .content { background-color: #ffffff; padding: 30px 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; }
    .content h1 { color: {{brand_color}}; margin-top: 0; }
    .button { display: inline-block; background-color: {{brand_color}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
    .success-badge { background-color: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      {{#brand_logo}}<img src="{{brand_logo}}" alt="{{brand_name}}" class="logo">{{/brand_logo}}
      <h2 style="margin: 0;">{{brand_name}}</h2>
    </div>
    <div class="content">
      <div class="success-badge">✓ Domain Active</div>
      <h1>Your Domain is Live!</h1>
      <p>Great news! Your custom domain <strong>{{domain_name}}</strong> has been successfully activated and is now live.</p>
      <p><strong>What this means:</strong></p>
      <ul>
        <li>Your site is accessible at <a href="https://{{domain_name}}">https://{{domain_name}}</a></li>
        <li>SSL certificate has been issued and installed</li>
        <li>All traffic is fully encrypted and secure</li>
      </ul>
      <a href="https://{{domain_name}}" class="button">Visit Your Site</a>
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Activated on {{activated_at}}</p>
    </div>
    <div class="footer">
      <p>Questions? Contact us at {{brand_support_email}}</p>
      <p style="margin: 5px 0;">&copy; {{brand_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>',
'Your domain {{domain_name}} is now active!

Great news! Your custom domain has been successfully activated and is now live.

Your site is accessible at: https://{{domain_name}}

What this means:
- SSL certificate has been issued and installed
- All traffic is fully encrypted and secure
- Your site is ready for visitors

Visit your site: https://{{domain_name}}

Activated on {{activated_at}}

Questions? Contact us at {{brand_support_email}}

© {{brand_name}}. All rights reserved.',
'["domain_name", "activated_at", "brand_support_email"]'::jsonb),

-- Brand Created Template
('brand_created', 'Brand Created', 'Sent when a new brand is created',
'Welcome to {{brand_name}}!',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: {{brand_color}}; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; }
    .content h1 { color: {{brand_color}}; margin-top: 0; }
    .button { display: inline-block; background-color: {{brand_color}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
    .checklist { background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .checklist li { margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Welcome to {{brand_name}}!</h2>
    </div>
    <div class="content">
      <h1>Your Brand is Ready</h1>
      <p>Congratulations! Your brand <strong>{{brand_name}}</strong> has been successfully created.</p>
      <div class="checklist">
        <h3>Next Steps:</h3>
        <ul>
          <li>✓ Brand created and configured</li>
          <li>→ Add a custom domain</li>
          <li>→ Configure email settings</li>
          <li>→ Customize your landing page</li>
        </ul>
      </div>
      <a href="{{admin_url}}" class="button">Go to Admin Portal</a>
    </div>
    <div class="footer">
      <p>Questions? Contact us at {{brand_support_email}}</p>
      <p style="margin: 5px 0;">&copy; {{brand_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>',
'Welcome to {{brand_name}}!

Congratulations! Your brand has been successfully created.

Next Steps:
✓ Brand created and configured
→ Add a custom domain
→ Configure email settings
→ Customize your landing page

Go to Admin Portal: {{admin_url}}

Questions? Contact us at {{brand_support_email}}

© {{brand_name}}. All rights reserved.',
'["admin_url", "brand_support_email"]'::jsonb),

-- Test Email Template
('test_email', 'Test Email', 'Template for testing email configuration',
'Test Email from {{brand_name}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: {{brand_color}}; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">{{brand_name}}</h2>
    </div>
    <div class="content">
      <h1>Test Email</h1>
      <p>This is a test email from <strong>{{brand_name}}</strong>.</p>
      <p>If you received this email, your email configuration is working correctly!</p>
      {{#test_message}}<p><em>{{test_message}}</em></p>{{/test_message}}
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Sent at {{sent_at}}</p>
    </div>
    <div class="footer">
      <p>&copy; {{brand_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>',
'Test Email from {{brand_name}}

This is a test email. If you received this, your email configuration is working correctly!

{{#test_message}}{{test_message}}{{/test_message}}

Sent at {{sent_at}}

© {{brand_name}}. All rights reserved.',
'["sent_at"]'::jsonb);

-- -----------------------------------------------------------------------------
-- PART 11: Seed Default Email Settings for Existing Brands
-- -----------------------------------------------------------------------------

-- Create default email settings for all existing brands
INSERT INTO public.brand_email_settings (brand_id, from_name, from_email, reply_to, is_active)
SELECT 
  id,
  name,
  'notifications@agents-institute.com',
  'support@agents-institute.com',
  true
FROM public.brands
WHERE id NOT IN (SELECT brand_id FROM public.brand_email_settings)
ON CONFLICT (brand_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- PART 12: Add Realtime Support
-- -----------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_email_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_events;

-- =============================================================================
-- Migration Complete
-- =============================================================================
