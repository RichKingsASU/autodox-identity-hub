-- =============================================================================
-- Add Missing Email Template: Domain Verification Failed
-- Purpose: Add the missing template referenced by send-brand-event-email function
-- Date: 2026-02-01
-- =============================================================================

INSERT INTO public.email_templates (template_key, name, description, subject, html_template, text_template, required_variables)
VALUES
('domain_verification_failed', 'Domain Verification Failed', 'Sent when custom domain verification fails',
'Action Required: Domain verification failed for {{domain_name}}',
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
    .error-box { background-color: #fee2e2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; color: #b91c1c; margin: 20px 0; }
    .button { display: inline-block; background-color: {{brand_color}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">{{brand_name}}</h2>
    </div>
    <div class="content">
      <h1>Verification Failed</h1>
      <p>We were unable to verify your custom domain <strong>{{domain_name}}</strong>.</p>
      
      <div class="error-box">
        <strong>Error Details:</strong><br>
        {{error_details}}
      </div>
      
      <h3>How to fix this:</h3>
      <ol>
        <li>Check your DNS configuration in the admin portal</li>
        <li>Ensure all required records are added to your DNS provider</li>
        <li>Wait for DNS propagation (up to 24-48 hours)</li>
        <li>Try verifying again</li>
      </ol>
      
      <a href="{{admin_url}}" class="button">Go to Admin Portal</a>
    </div>
    <div class="footer">
      <p>Questions? Contact us at {{brand_support_email}}</p>
      <p>&copy; {{brand_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>',
'Action Required: Domain verification failed for {{domain_name}}

We were unable to verify your custom domain {{domain_name}}.

Error Details:
{{error_details}}

How to fix this:
1. Check your DNS configuration in the admin portal
2. Ensure all required records are added to your DNS provider
3. Wait for DNS propagation (up to 24-48 hours)
4. Try verifying again

Go to Admin Portal: {{admin_url}}

Questions? Contact us at {{brand_support_email}}

© {{brand_name}}. All rights reserved.',
'["domain_name", "error_details", "admin_url"]'::jsonb);
