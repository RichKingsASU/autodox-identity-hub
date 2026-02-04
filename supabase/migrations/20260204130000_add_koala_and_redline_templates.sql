-- =============================================================================
-- Add Koala Sign and Redline Delivery templates
-- =============================================================================

-- Insert Koala Sign template
INSERT INTO public.landing_templates (
  name,
  slug,
  category,
  base_layout,
  version,
  status,
  editable_fields,
  default_copy,
  default_theme_overrides,
  sections_enabled
) VALUES (
  'Koala Sign',
  'koala-sign',
  'saas',
  'koala_sign',
  1,
  'published',
  '{
    "hero_headline": true,
    "hero_subheadline": true,
    "primary_cta_text": true,
    "trust_badge_text": true,
    "footer_disclaimer": true,
    "primary_color": true,
    "accent_color": true
  }'::jsonb,
  '{
    "brandName": "KoalaSign",
    "heroHeadline": "Document Security,",
    "heroHeadlineAccent": "Simplified.",
    "heroSubheadline": "The secure way to verify, sign, and store your most sensitive agreements. Protected by bank-grade encryption, trusted by thousands.",
    "primaryCtaText": "Get Started Free",
    "secondaryCtaText": "See How It Works",
    "badgeText": "Trusted by 10,000+ businesses",
    "trustBadgeText": "Enterprise-grade security",
    "footerDisclaimer": "KoalaSign. All rights reserved.",
    "featuresSectionTitle": "Features",
    "featuresSectionSubtitle": "Enterprise-grade security features that keep your documents safe without compromising ease of use.",
    "pricingSectionTitle": "Simple, Transparent Pricing",
    "pricingSectionSubtitle": "Choose the plan that fits your needs. All plans include our core security features.",
    "faqSectionTitle": "Frequently Asked Questions",
    "contactSectionTitle": "Get in Touch",
    "contactSectionSubtitle": "Have questions? We would love to hear from you.",
    "featureItems": [
      {"title": "Bank-Grade Security", "description": "Your documents are protected with AES-256 encryption, the same standard used by leading financial institutions.", "icon": "shield", "large": true},
      {"title": "Lightning Fast", "description": "Verify documents in under 3 seconds with our optimized verification engine.", "icon": "zap"},
      {"title": "Global Compliance", "description": "GDPR, SOC 2, and HIPAA ready. Meet regulatory requirements across all major jurisdictions.", "icon": "globe"},
      {"title": "Instant Verification", "description": "Verify document authenticity in seconds with our advanced verification system.", "icon": "check"},
      {"title": "Audit Trails", "description": "Complete activity history for every document. Know who accessed what and when.", "icon": "lock"},
      {"title": "Team Collaboration", "description": "Work together securely with role-based permissions and real-time collaboration.", "icon": "users"}
    ],
    "pricingPlans": [
      {"name": "Free", "price": "$0", "period": "forever", "description": "Perfect for individuals getting started", "features": ["Up to 5 documents/month", "Basic verification", "Email support", "1 user"], "cta": "Get Started"},
      {"name": "Starter", "price": "$12", "period": "/month", "description": "Essential features for small teams", "features": ["Up to 50 documents/month", "Advanced verification", "Priority email support", "Up to 5 users", "Basic audit trails"], "cta": "Start Free Trial"},
      {"name": "Professional", "price": "$49", "period": "/month", "description": "Advanced features for growing businesses", "features": ["Unlimited documents", "Full verification suite", "24/7 priority support", "Up to 25 users", "Complete audit trails", "API access", "Custom branding"], "cta": "Start Free Trial", "popular": true},
      {"name": "Enterprise", "price": "Custom", "period": "", "description": "Tailored solutions for large organizations", "features": ["Everything in Professional", "Unlimited users", "Dedicated account manager", "Custom integrations", "SLA guarantee", "On-premise option"], "cta": "Contact Sales"}
    ],
    "faqs": [
      {"question": "Is it legally binding?", "answer": "Yes, our e-signatures are legally binding in most countries, compliant with ESIGN, UETA, and eIDAS regulations."},
      {"question": "How secure is my data?", "answer": "We use AES-256 encryption, the same standard used by banks and government agencies. All data is encrypted at rest and in transit."},
      {"question": "Can I try it for free?", "answer": "Yes! Our free plan includes 5 documents per month with full verification features. No credit card required."},
      {"question": "What file formats are supported?", "answer": "We support PDF, DOCX, PNG, JPG, and many other common document formats."},
      {"question": "Do you offer API access?", "answer": "Yes, our Professional and Enterprise plans include full API access for integration with your existing workflows."},
      {"question": "How does team collaboration work?", "answer": "You can invite team members with different permission levels. Admins can manage users, while viewers can only access documents shared with them."}
    ],
    "trustItems": ["Bank-Grade Security", "SOC 2 Certified", "GDPR Compliant", "99.9% Uptime"]
  }'::jsonb,
  '{
    "primaryColor": "#10b981",
    "accentColor": "#14b8a6"
  }'::jsonb,
  '{
    "hero": true,
    "features": true,
    "pricing": true,
    "trustBadges": true,
    "testimonials": false,
    "compliance": false,
    "footer": true,
    "faq": true,
    "contact": true,
    "services": false,
    "about": false,
    "stats": false
  }'::jsonb
);

-- Insert Redline Delivery template
INSERT INTO public.landing_templates (
  name,
  slug,
  category,
  base_layout,
  version,
  status,
  editable_fields,
  default_copy,
  default_theme_overrides,
  sections_enabled
) VALUES (
  'Redline Delivery',
  'redline-delivery',
  'corporate',
  'redline_delivery',
  1,
  'published',
  '{
    "hero_headline": true,
    "hero_subheadline": true,
    "primary_cta_text": true,
    "trust_badge_text": true,
    "footer_disclaimer": true,
    "primary_color": true,
    "accent_color": true
  }'::jsonb,
  '{
    "brandName": "PDS",
    "brandTagline": "Pro Delivery",
    "heroHeadline": "Pro Delivery",
    "heroHeadlineAccent": "Systems",
    "heroSubheadline": "Multi-channel communication solutions that connect your brand with audiences worldwide through SMS, Email, and Direct Mail.",
    "primaryCtaText": "Get Started",
    "secondaryCtaText": "Explore Services",
    "badgeText": "Enterprise Communication Platform",
    "trustBadgeText": "Trusted worldwide",
    "footerDisclaimer": "Pro Delivery Systems. All rights reserved.",
    "featuresSectionSubtitle": "Comprehensive communication solutions designed for modern businesses",
    "testimonialsSectionTitle": "Trusted by industry leaders",
    "contactSectionTitle": "Let''s work together",
    "contactSectionSubtitle": "Get in touch with our team to discuss your communication needs",
    "services": [
      {"icon": "globe", "title": "Global Fleet", "subtitle": "Network", "description": "Worldwide delivery infrastructure with real-time tracking and intelligent routing across 180+ countries.", "size": "medium"},
      {"icon": "message", "title": "SMS Relay", "subtitle": "Messaging", "description": "Direct text messaging with 99.9% delivery rates and two-way communication support.", "size": "small"},
      {"icon": "send", "title": "Direct Mail", "subtitle": "Physical", "description": "Automated physical mail campaigns with address verification and tracking analytics.", "size": "small"},
      {"icon": "mail", "title": "Email Systems", "subtitle": "Enterprise", "description": "Professional email solutions including auto-responders, marketing blasts, and transactional emails.", "size": "medium"}
    ],
    "testimonials": [
      {"quote": "PDS transformed our customer communication. Delivery rates improved by 40%.", "author": "Sarah Chen", "role": "VP of Operations", "company": "TechCorp"},
      {"quote": "The multi-channel approach helped us reach customers we never could before.", "author": "Marcus Johnson", "role": "Marketing Director", "company": "RetailPro"},
      {"quote": "Enterprise-grade reliability with startup-friendly support. Exactly what we needed.", "author": "Emily Rodriguez", "role": "CTO", "company": "FinanceHub"}
    ],
    "stats": [
      {"value": "180+", "label": "Countries Served"},
      {"value": "1B+", "label": "Messages Monthly"},
      {"value": "99.9%", "label": "Uptime SLA"},
      {"value": "24/7", "label": "Support"}
    ],
    "trustItems": ["180+ Countries", "1B+ Messages/Month", "99.9% Uptime"]
  }'::jsonb,
  '{
    "primaryColor": "#2563eb",
    "accentColor": "#4f46e5"
  }'::jsonb,
  '{
    "hero": true,
    "features": false,
    "pricing": false,
    "trustBadges": true,
    "testimonials": true,
    "compliance": false,
    "footer": true,
    "faq": false,
    "contact": true,
    "services": true,
    "about": false,
    "stats": true
  }'::jsonb
);

-- Add comment
COMMENT ON TABLE public.landing_templates IS 'Landing page templates including Koala Sign (document security SaaS) and Redline Delivery (corporate communication) layouts';
