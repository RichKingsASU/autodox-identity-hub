-- Phase 1: Admin Template Management System Database Architecture

-- 1.1 Create Custom ENUM Types
CREATE TYPE landing_base_layout AS ENUM (
  'hero_focused',
  'compliance_heavy',
  'trust_signal_dense',
  'minimal_enterprise',
  'sdk_focused',
  'global_reach',
  'security_first',
  'conversion_optimized'
);

CREATE TYPE template_status AS ENUM ('draft', 'published', 'disabled');

-- 1.2 Create landing_templates Table
CREATE TABLE public.landing_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  category text DEFAULT 'landing',
  base_layout landing_base_layout NOT NULL,
  version integer NOT NULL DEFAULT 1,
  status template_status NOT NULL DEFAULT 'draft',
  editable_fields jsonb NOT NULL,
  default_copy jsonb NOT NULL,
  default_theme_overrides jsonb NOT NULL,
  sections_enabled jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.3 Create template_activity_log Table (Immutable Audit Trail)
CREATE TABLE public.template_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.landing_templates(id),
  template_slug text NOT NULL,
  brand_id uuid REFERENCES public.brands(id),
  action text NOT NULL,
  changes jsonb,
  performed_by uuid NOT NULL,
  performed_at timestamptz DEFAULT now()
);

-- 1.4 Extend brands Table with Template Binding Columns
ALTER TABLE public.brands 
ADD COLUMN active_template_id uuid REFERENCES public.landing_templates(id),
ADD COLUMN applied_template_version integer,
ADD COLUMN template_applied_at timestamptz,
ADD COLUMN template_applied_by uuid,
ADD COLUMN previous_template_id uuid REFERENCES public.landing_templates(id),
ADD COLUMN previous_template_version integer;

-- 1.5 Create Version Auto-Increment Trigger
CREATE OR REPLACE FUNCTION public.increment_template_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version := OLD.version + 1;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER template_version_trigger
  BEFORE UPDATE ON public.landing_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_template_version();

-- 1.6 Create Immutable Activity Log Protection Triggers
CREATE OR REPLACE FUNCTION public.prevent_activity_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'template_activity_log is immutable. UPDATE and DELETE operations are not allowed.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER prevent_activity_log_update
  BEFORE UPDATE ON public.template_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_activity_log_modification();

CREATE TRIGGER prevent_activity_log_delete
  BEFORE DELETE ON public.template_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_activity_log_modification();

-- 1.7 Enable RLS on New Tables
ALTER TABLE public.landing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_activity_log ENABLE ROW LEVEL SECURITY;

-- 1.8 RLS Policies for landing_templates (Admin Only, No DELETE)
CREATE POLICY "Admins can view all templates"
  ON public.landing_templates FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create templates"
  ON public.landing_templates FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update templates"
  ON public.landing_templates FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- No DELETE policy - templates are disabled, never deleted

-- 1.9 RLS Policies for template_activity_log (Admin Only, Immutable)
CREATE POLICY "Admins can view activity log"
  ON public.template_activity_log FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert activity log"
  ON public.template_activity_log FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- No UPDATE/DELETE policies - triggers prevent these operations anyway

-- 2.0 Seed 60 Templates (All Published)

-- Hero Focused Templates (8)
INSERT INTO public.landing_templates (name, slug, base_layout, status, editable_fields, default_copy, default_theme_overrides, sections_enabled) VALUES
('Enterprise Pro', 'hero-enterprise-pro', 'hero_focused', 'published',
  '{"hero_headline": "Enterprise-Grade Identity Verification", "hero_subheadline": "Trusted by Fortune 500 companies worldwide", "primary_cta_text": "Get Started", "trust_badge_text": "SOC2 Certified", "footer_disclaimer": "Enterprise terms apply. Contact sales for custom agreements.", "primary_color": "#8B5CF6", "accent_color": "#EC4899"}',
  '{"badge_text": "Enterprise Ready", "feature_items": [{"icon": "Shield", "title": "Bank-Grade Security", "description": "256-bit encryption for all data"}, {"icon": "Zap", "title": "Instant Verification", "description": "Real-time identity checks"}, {"icon": "Globe", "title": "Global Coverage", "description": "200+ countries supported"}], "trust_items": ["Fortune 500 Trusted", "99.99% Uptime", "24/7 Support"], "compliance_badges": ["SOC2", "GDPR", "CCPA"]}',
  '{"primary_color": "#8B5CF6", "accent_color": "#EC4899"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Startup Velocity', 'hero-startup-velocity', 'hero_focused', 'published',
  '{"hero_headline": "Launch Faster with Verified Users", "hero_subheadline": "Get your product to market with trusted identity verification", "primary_cta_text": "Start Free Trial", "trust_badge_text": "Startup Friendly", "footer_disclaimer": "Free tier available. No credit card required to start.", "primary_color": "#10B981", "accent_color": "#3B82F6"}',
  '{"badge_text": "Startup Ready", "feature_items": [{"icon": "Rocket", "title": "Quick Integration", "description": "Launch in under 10 minutes"}, {"icon": "Code", "title": "Developer First", "description": "Clean APIs and SDKs"}, {"icon": "DollarSign", "title": "Pay as You Grow", "description": "Scale-friendly pricing"}], "trust_items": ["500+ Startups", "YC Backed Companies", "Series A Ready"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#10B981", "accent_color": "#3B82F6"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Scale Ready', 'hero-scale-ready', 'hero_focused', 'published',
  '{"hero_headline": "Built for Your Next Million Users", "hero_subheadline": "Infrastructure that scales with your ambitions", "primary_cta_text": "Request Demo", "trust_badge_text": "High Volume", "footer_disclaimer": "Volume discounts available for qualifying accounts.", "primary_color": "#F59E0B", "accent_color": "#EF4444"}',
  '{"badge_text": "Scale Ready", "feature_items": [{"icon": "TrendingUp", "title": "Auto-Scaling", "description": "Handle any traffic surge"}, {"icon": "Server", "title": "Multi-Region", "description": "Global infrastructure"}, {"icon": "Activity", "title": "Real-Time Analytics", "description": "Monitor everything"}], "trust_items": ["1B+ Verifications", "Sub-100ms Latency", "Zero Downtime"], "compliance_badges": ["SOC2", "ISO27001", "GDPR"]}',
  '{"primary_color": "#F59E0B", "accent_color": "#EF4444"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

('Digital First', 'hero-digital-first', 'hero_focused', 'published',
  '{"hero_headline": "The Modern Identity Platform", "hero_subheadline": "Digital-native verification for digital-native businesses", "primary_cta_text": "Explore Platform", "trust_badge_text": "API First", "footer_disclaimer": "Platform access subject to approval.", "primary_color": "#6366F1", "accent_color": "#14B8A6"}',
  '{"badge_text": "Modern Stack", "feature_items": [{"icon": "Smartphone", "title": "Mobile Optimized", "description": "Seamless mobile experience"}, {"icon": "Wifi", "title": "Headless Ready", "description": "Build your own UI"}, {"icon": "Layers", "title": "Composable", "description": "Mix and match features"}], "trust_items": ["API-First Design", "99.9% API Uptime", "Webhook Support"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#6366F1", "accent_color": "#14B8A6"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Fintech Edition', 'hero-fintech-edition', 'hero_focused', 'published',
  '{"hero_headline": "Identity for Financial Services", "hero_subheadline": "Meet regulatory requirements with confidence", "primary_cta_text": "Contact Sales", "trust_badge_text": "Fintech Ready", "footer_disclaimer": "Subject to financial services compliance review.", "primary_color": "#0EA5E9", "accent_color": "#8B5CF6"}',
  '{"badge_text": "Fintech Grade", "feature_items": [{"icon": "CreditCard", "title": "KYC Compliant", "description": "Full KYC/AML support"}, {"icon": "FileCheck", "title": "Document Verification", "description": "200+ document types"}, {"icon": "UserCheck", "title": "Biometric Auth", "description": "Face and voice matching"}], "trust_items": ["Top 10 Banks", "Licensed MSB", "FinCEN Registered"], "compliance_badges": ["SOC2", "PCI-DSS", "BSA/AML"]}',
  '{"primary_color": "#0EA5E9", "accent_color": "#8B5CF6"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

('Healthcare Plus', 'hero-healthcare-plus', 'hero_focused', 'published',
  '{"hero_headline": "HIPAA-Ready Identity Verification", "hero_subheadline": "Secure patient identity for healthcare providers", "primary_cta_text": "Schedule Demo", "trust_badge_text": "HIPAA Compliant", "footer_disclaimer": "BAA available upon request.", "primary_color": "#06B6D4", "accent_color": "#10B981"}',
  '{"badge_text": "Healthcare Ready", "feature_items": [{"icon": "Heart", "title": "Patient Matching", "description": "Accurate patient identification"}, {"icon": "Lock", "title": "PHI Protection", "description": "HIPAA-compliant data handling"}, {"icon": "FileText", "title": "Insurance Verification", "description": "Real-time eligibility checks"}], "trust_items": ["100+ Health Systems", "HITRUST Certified", "Epic Integration"], "compliance_badges": ["HIPAA", "SOC2", "HITRUST"]}',
  '{"primary_color": "#06B6D4", "accent_color": "#10B981"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Government Ready', 'hero-government-ready', 'hero_focused', 'published',
  '{"hero_headline": "Federal-Grade Identity Solutions", "hero_subheadline": "FedRAMP authorized identity verification", "primary_cta_text": "Request RFI", "trust_badge_text": "FedRAMP", "footer_disclaimer": "Government contracts subject to procurement requirements.", "primary_color": "#1E40AF", "accent_color": "#DC2626"}',
  '{"badge_text": "Gov Ready", "feature_items": [{"icon": "Building", "title": "Agency Integration", "description": "GSA Schedule approved"}, {"icon": "ShieldCheck", "title": "FedRAMP High", "description": "Highest security tier"}, {"icon": "Users", "title": "Citizen Services", "description": "Public-facing solutions"}], "trust_items": ["50+ Agencies", "IL4 Authorized", "CJIS Compliant"], "compliance_badges": ["FedRAMP", "StateRAMP", "CJIS"]}',
  '{"primary_color": "#1E40AF", "accent_color": "#DC2626"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Marketplace Ready', 'hero-marketplace-ready', 'hero_focused', 'published',
  '{"hero_headline": "Trust Every Transaction", "hero_subheadline": "Verify buyers and sellers on your platform", "primary_cta_text": "Get API Key", "trust_badge_text": "Marketplace", "footer_disclaimer": "Platform integration support included.", "primary_color": "#7C3AED", "accent_color": "#F59E0B"}',
  '{"badge_text": "Marketplace", "feature_items": [{"icon": "ShoppingBag", "title": "Seller Verification", "description": "Vet your marketplace sellers"}, {"icon": "Users", "title": "Buyer Trust", "description": "Build customer confidence"}, {"icon": "RefreshCw", "title": "Continuous Monitoring", "description": "Ongoing risk assessment"}], "trust_items": ["Top Marketplaces", "Fraud Reduction", "Trust Scores"], "compliance_badges": ["SOC2", "GDPR", "CCPA"]}',
  '{"primary_color": "#7C3AED", "accent_color": "#F59E0B"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

-- Compliance Heavy Templates (8)
('HIPAA Shield', 'compliance-hipaa-shield', 'compliance_heavy', 'published',
  '{"hero_headline": "HIPAA-Compliant Identity Verification", "hero_subheadline": "Protect patient data with certified security", "primary_cta_text": "Get BAA", "trust_badge_text": "HIPAA Certified", "footer_disclaimer": "Business Associate Agreement available for qualifying organizations.", "primary_color": "#059669", "accent_color": "#0891B2"}',
  '{"badge_text": "HIPAA Ready", "feature_items": [{"icon": "Shield", "title": "PHI Protection", "description": "End-to-end encryption"}, {"icon": "FileCheck", "title": "Audit Trails", "description": "Complete access logging"}, {"icon": "Lock", "title": "Access Controls", "description": "Role-based permissions"}], "trust_items": ["BAA Available", "Annual Audits", "Breach Protection"], "compliance_badges": ["HIPAA", "HITRUST", "SOC2"]}',
  '{"primary_color": "#059669", "accent_color": "#0891B2"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('SOC2 Certified', 'compliance-soc2-certified', 'compliance_heavy', 'published',
  '{"hero_headline": "SOC2 Type II Certified Platform", "hero_subheadline": "Annual audits by leading security firms", "primary_cta_text": "View Report", "trust_badge_text": "SOC2 Type II", "footer_disclaimer": "SOC2 report available under NDA.", "primary_color": "#4F46E5", "accent_color": "#7C3AED"}',
  '{"badge_text": "SOC2 Certified", "feature_items": [{"icon": "CheckCircle", "title": "Annual Audits", "description": "Continuous compliance"}, {"icon": "Eye", "title": "Transparency", "description": "Full audit reports"}, {"icon": "Settings", "title": "Controls", "description": "100+ security controls"}], "trust_items": ["Type II Certified", "Zero Findings", "Big 4 Audited"], "compliance_badges": ["SOC2", "SOC1", "ISO27001"]}',
  '{"primary_color": "#4F46E5", "accent_color": "#7C3AED"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('PCI Ready', 'compliance-pci-ready', 'compliance_heavy', 'published',
  '{"hero_headline": "PCI DSS Compliant Verification", "hero_subheadline": "Secure payment identity for financial services", "primary_cta_text": "Get AOC", "trust_badge_text": "PCI DSS", "footer_disclaimer": "Attestation of Compliance available upon request.", "primary_color": "#DC2626", "accent_color": "#F59E0B"}',
  '{"badge_text": "PCI Compliant", "feature_items": [{"icon": "CreditCard", "title": "Card Security", "description": "PCI Level 1 certified"}, {"icon": "Database", "title": "Tokenization", "description": "Secure data storage"}, {"icon": "Shield", "title": "Fraud Prevention", "description": "Real-time monitoring"}], "trust_items": ["Level 1 Service", "QSA Validated", "Annual Assessment"], "compliance_badges": ["PCI-DSS", "PA-DSS", "SOC2"]}',
  '{"primary_color": "#DC2626", "accent_color": "#F59E0B"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('GDPR Fortress', 'compliance-gdpr-fortress', 'compliance_heavy', 'published',
  '{"hero_headline": "GDPR-Compliant Identity Platform", "hero_subheadline": "European data protection built in", "primary_cta_text": "View DPA", "trust_badge_text": "GDPR Ready", "footer_disclaimer": "Data Processing Agreement included with all contracts.", "primary_color": "#2563EB", "accent_color": "#10B981"}',
  '{"badge_text": "EU Compliant", "feature_items": [{"icon": "MapPin", "title": "EU Data Residency", "description": "Data stays in Europe"}, {"icon": "Trash2", "title": "Right to Delete", "description": "Automated data removal"}, {"icon": "FileText", "title": "Consent Management", "description": "Full consent tracking"}], "trust_items": ["EU Servers", "DPO Appointed", "DPIA Complete"], "compliance_badges": ["GDPR", "eIDAS", "SOC2"]}',
  '{"primary_color": "#2563EB", "accent_color": "#10B981"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('CCPA Shield', 'compliance-ccpa-shield', 'compliance_heavy', 'published',
  '{"hero_headline": "California Privacy Compliant", "hero_subheadline": "CCPA and CPRA ready identity verification", "primary_cta_text": "Learn More", "trust_badge_text": "CCPA Ready", "footer_disclaimer": "Privacy rights supported for California residents.", "primary_color": "#0369A1", "accent_color": "#65A30D"}',
  '{"badge_text": "CA Compliant", "feature_items": [{"icon": "UserX", "title": "Opt-Out Rights", "description": "Honor consumer requests"}, {"icon": "Eye", "title": "Transparency", "description": "Clear data practices"}, {"icon": "Shield", "title": "Data Protection", "description": "Enhanced safeguards"}], "trust_items": ["CCPA Ready", "CPRA Updated", "Privacy First"], "compliance_badges": ["CCPA", "CPRA", "SOC2"]}',
  '{"primary_color": "#0369A1", "accent_color": "#65A30D"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('ISO Certified', 'compliance-iso-certified', 'compliance_heavy', 'published',
  '{"hero_headline": "ISO 27001 Certified Security", "hero_subheadline": "International standard for information security", "primary_cta_text": "View Certificate", "trust_badge_text": "ISO 27001", "footer_disclaimer": "Certificate issued by accredited certification body.", "primary_color": "#0F766E", "accent_color": "#7C3AED"}',
  '{"badge_text": "ISO Certified", "feature_items": [{"icon": "Award", "title": "Certified ISMS", "description": "Formal security program"}, {"icon": "RefreshCw", "title": "Annual Surveillance", "description": "Ongoing certification"}, {"icon": "FileCheck", "title": "Risk Management", "description": "Formal risk framework"}], "trust_items": ["Accredited CB", "Annual Audits", "Global Standard"], "compliance_badges": ["ISO27001", "ISO27017", "SOC2"]}',
  '{"primary_color": "#0F766E", "accent_color": "#7C3AED"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('FedRAMP Authorized', 'compliance-fedramp-auth', 'compliance_heavy', 'published',
  '{"hero_headline": "FedRAMP Authorized Platform", "hero_subheadline": "Federal security standards for identity verification", "primary_cta_text": "View Package", "trust_badge_text": "FedRAMP High", "footer_disclaimer": "Authorization package available to government agencies.", "primary_color": "#1E3A8A", "accent_color": "#B91C1C"}',
  '{"badge_text": "FedRAMP", "feature_items": [{"icon": "Building", "title": "High Baseline", "description": "421 security controls"}, {"icon": "Users", "title": "3PAO Assessed", "description": "Independent validation"}, {"icon": "Shield", "title": "Continuous Monitoring", "description": "Monthly POA&M"}], "trust_items": ["JAB Authorized", "Agency ATOs", "ConMon Active"], "compliance_badges": ["FedRAMP", "FISMA", "NIST"]}',
  '{"primary_color": "#1E3A8A", "accent_color": "#B91C1C"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Multi-Compliance', 'compliance-multi-standard', 'compliance_heavy', 'published',
  '{"hero_headline": "Complete Compliance Coverage", "hero_subheadline": "Every major standard, one platform", "primary_cta_text": "View All Certs", "trust_badge_text": "Multi-Certified", "footer_disclaimer": "Full compliance documentation available under NDA.", "primary_color": "#4338CA", "accent_color": "#059669"}',
  '{"badge_text": "Fully Certified", "feature_items": [{"icon": "CheckCircle", "title": "10+ Standards", "description": "Comprehensive coverage"}, {"icon": "Globe", "title": "Global Compliance", "description": "Regional requirements met"}, {"icon": "FileCheck", "title": "Single Vendor", "description": "Simplify your audits"}], "trust_items": ["All Major Standards", "Unified Reporting", "Audit Support"], "compliance_badges": ["SOC2", "ISO27001", "HIPAA", "PCI"]}',
  '{"primary_color": "#4338CA", "accent_color": "#059669"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

-- Trust Signal Dense Templates (7)
('Social Proof Max', 'trust-social-proof-max', 'trust_signal_dense', 'published',
  '{"hero_headline": "Trusted by Industry Leaders", "hero_subheadline": "Join thousands of companies securing their users", "primary_cta_text": "Join Them", "trust_badge_text": "Trusted Choice", "footer_disclaimer": "Customer logos used with permission.", "primary_color": "#8B5CF6", "accent_color": "#F59E0B"}',
  '{"badge_text": "Industry Leader", "feature_items": [{"icon": "Users", "title": "10,000+ Customers", "description": "Growing community"}, {"icon": "Star", "title": "4.9 Rating", "description": "G2 and Capterra"}, {"icon": "Award", "title": "Best in Class", "description": "Industry recognition"}], "trust_items": ["Fortune 500", "Unicorn Startups", "Government Agencies"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#8B5CF6", "accent_color": "#F59E0B"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

('Enterprise Trusted', 'trust-enterprise-trusted', 'trust_signal_dense', 'published',
  '{"hero_headline": "Enterprise-Approved Security", "hero_subheadline": "Vetted by the worlds largest security teams", "primary_cta_text": "See Case Studies", "trust_badge_text": "Enterprise", "footer_disclaimer": "Case studies available upon request.", "primary_color": "#1E40AF", "accent_color": "#10B981"}',
  '{"badge_text": "Enterprise Grade", "feature_items": [{"icon": "Building", "title": "F500 Customers", "description": "Trusted by the best"}, {"icon": "Shield", "title": "Security Approved", "description": "Passed vendor reviews"}, {"icon": "Clock", "title": "5+ Years", "description": "Proven track record"}], "trust_items": ["Security Audited", "Vendor Approved", "Long-term Partner"], "compliance_badges": ["SOC2", "ISO27001", "GDPR"]}',
  '{"primary_color": "#1E40AF", "accent_color": "#10B981"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

('Customer First', 'trust-customer-first', 'trust_signal_dense', 'published',
  '{"hero_headline": "Built on Customer Success", "hero_subheadline": "Our customers growth is our mission", "primary_cta_text": "Read Reviews", "trust_badge_text": "5-Star Rated", "footer_disclaimer": "Reviews collected from verified customers.", "primary_color": "#059669", "accent_color": "#8B5CF6"}',
  '{"badge_text": "Customer Loved", "feature_items": [{"icon": "Heart", "title": "98% Satisfaction", "description": "CSAT score"}, {"icon": "MessageCircle", "title": "24/7 Support", "description": "Always available"}, {"icon": "TrendingUp", "title": "Growth Partner", "description": "Scale together"}], "trust_items": ["G2 Leader", "Capterra Top Rated", "TrustRadius Winner"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#059669", "accent_color": "#8B5CF6"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

('Testimonial Rich', 'trust-testimonial-rich', 'trust_signal_dense', 'published',
  '{"hero_headline": "Hear From Our Customers", "hero_subheadline": "Real stories from real businesses", "primary_cta_text": "Read Stories", "trust_badge_text": "Real Stories", "footer_disclaimer": "Testimonials from verified customers.", "primary_color": "#7C3AED", "accent_color": "#EC4899"}',
  '{"badge_text": "Real Reviews", "feature_items": [{"icon": "Quote", "title": "100+ Testimonials", "description": "Authentic feedback"}, {"icon": "Video", "title": "Video Stories", "description": "Customer interviews"}, {"icon": "Star", "title": "Case Studies", "description": "Detailed success stories"}], "trust_items": ["Video Testimonials", "Written Reviews", "Success Metrics"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#7C3AED", "accent_color": "#EC4899"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

('Logo Wall', 'trust-logo-wall', 'trust_signal_dense', 'published',
  '{"hero_headline": "Powering Leading Brands", "hero_subheadline": "The identity platform for ambitious companies", "primary_cta_text": "Join Leaders", "trust_badge_text": "Brand Trusted", "footer_disclaimer": "Logos displayed with customer permission.", "primary_color": "#0EA5E9", "accent_color": "#F59E0B"}',
  '{"badge_text": "Top Brands", "feature_items": [{"icon": "Award", "title": "Category Leaders", "description": "Industry champions"}, {"icon": "Globe", "title": "Global Brands", "description": "Worldwide reach"}, {"icon": "TrendingUp", "title": "Fast Growers", "description": "Scaling businesses"}], "trust_items": ["Top 100 Brands", "Industry Leaders", "Market Makers"], "compliance_badges": ["SOC2", "ISO27001"]}',
  '{"primary_color": "#0EA5E9", "accent_color": "#F59E0B"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

('Stats Showcase', 'trust-stats-showcase', 'trust_signal_dense', 'published',
  '{"hero_headline": "The Numbers Speak", "hero_subheadline": "Proven performance at massive scale", "primary_cta_text": "See Our Scale", "trust_badge_text": "Data Driven", "footer_disclaimer": "Statistics based on platform performance data.", "primary_color": "#DC2626", "accent_color": "#10B981"}',
  '{"badge_text": "By The Numbers", "feature_items": [{"icon": "BarChart", "title": "1B+ Verifications", "description": "Annually processed"}, {"icon": "Clock", "title": "99.99% Uptime", "description": "Always available"}, {"icon": "Zap", "title": "<100ms Response", "description": "Lightning fast"}], "trust_items": ["1B+ Processed", "99.99% SLA", "50M+ Daily"], "compliance_badges": ["SOC2", "ISO27001"]}',
  '{"primary_color": "#DC2626", "accent_color": "#10B981"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

('Award Winner', 'trust-award-winner', 'trust_signal_dense', 'published',
  '{"hero_headline": "Award-Winning Platform", "hero_subheadline": "Recognized by industry analysts and peers", "primary_cta_text": "See Awards", "trust_badge_text": "Award Winner", "footer_disclaimer": "Awards and recognitions from verified sources.", "primary_color": "#F59E0B", "accent_color": "#7C3AED"}',
  '{"badge_text": "Best in Class", "feature_items": [{"icon": "Award", "title": "Gartner Leader", "description": "Magic Quadrant"}, {"icon": "Star", "title": "G2 Leader", "description": "15 consecutive quarters"}, {"icon": "Trophy", "title": "Innovation Award", "description": "Industry recognition"}], "trust_items": ["Analyst Rated", "Peer Reviewed", "Innovation Leader"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#F59E0B", "accent_color": "#7C3AED"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

-- Minimal Enterprise Templates (7)
('Clean Corporate', 'minimal-clean-corporate', 'minimal_enterprise', 'published',
  '{"hero_headline": "Enterprise Identity Solutions", "hero_subheadline": "Professional verification services", "primary_cta_text": "Contact Sales", "trust_badge_text": "Enterprise", "footer_disclaimer": "Enterprise agreements available.", "primary_color": "#1E293B", "accent_color": "#3B82F6"}',
  '{"badge_text": "Professional", "feature_items": [{"icon": "Building", "title": "Enterprise Ready", "description": "Built for scale"}, {"icon": "Shield", "title": "Secure", "description": "Bank-grade security"}, {"icon": "Headphones", "title": "Dedicated Support", "description": "White-glove service"}], "trust_items": ["Enterprise SLA", "Dedicated CSM", "Custom Terms"], "compliance_badges": ["SOC2", "ISO27001"]}',
  '{"primary_color": "#1E293B", "accent_color": "#3B82F6"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Executive Suite', 'minimal-executive-suite', 'minimal_enterprise', 'published',
  '{"hero_headline": "Identity for the Enterprise", "hero_subheadline": "Executive-level service and support", "primary_cta_text": "Request Meeting", "trust_badge_text": "Executive", "footer_disclaimer": "Executive briefings available.", "primary_color": "#0F172A", "accent_color": "#8B5CF6"}',
  '{"badge_text": "Executive", "feature_items": [{"icon": "Briefcase", "title": "C-Suite Ready", "description": "Board-level reports"}, {"icon": "Users", "title": "Account Team", "description": "Dedicated resources"}, {"icon": "LineChart", "title": "ROI Tracking", "description": "Value metrics"}], "trust_items": ["Executive Access", "Strategic Partner", "Business Reviews"], "compliance_badges": ["SOC2", "ISO27001", "GDPR"]}',
  '{"primary_color": "#0F172A", "accent_color": "#8B5CF6"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Boardroom Ready', 'minimal-boardroom-ready', 'minimal_enterprise', 'published',
  '{"hero_headline": "Security Leadership Trusts", "hero_subheadline": "Vendor of choice for security-conscious enterprises", "primary_cta_text": "Executive Brief", "trust_badge_text": "Board Ready", "footer_disclaimer": "Board presentation materials available.", "primary_color": "#18181B", "accent_color": "#10B981"}',
  '{"badge_text": "Leadership", "feature_items": [{"icon": "PieChart", "title": "Board Reports", "description": "Executive dashboards"}, {"icon": "Shield", "title": "Risk Reduction", "description": "Quantified impact"}, {"icon": "Target", "title": "Strategic Alignment", "description": "Business objectives"}], "trust_items": ["Board Approved", "Risk Committee", "Audit Ready"], "compliance_badges": ["SOC2", "ISO27001"]}',
  '{"primary_color": "#18181B", "accent_color": "#10B981"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Professional Services', 'minimal-professional-services', 'minimal_enterprise', 'published',
  '{"hero_headline": "Professional Identity Services", "hero_subheadline": "Tailored solutions for your organization", "primary_cta_text": "Discuss Needs", "trust_badge_text": "Professional", "footer_disclaimer": "Custom implementations available.", "primary_color": "#334155", "accent_color": "#0EA5E9"}',
  '{"badge_text": "Services", "feature_items": [{"icon": "Settings", "title": "Custom Setup", "description": "Tailored configuration"}, {"icon": "Users", "title": "Training", "description": "Team enablement"}, {"icon": "Headphones", "title": "Ongoing Support", "description": "Partner for success"}], "trust_items": ["Implementation Team", "Training Programs", "Success Plans"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#334155", "accent_color": "#0EA5E9"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Premium Platform', 'minimal-premium-platform', 'minimal_enterprise', 'published',
  '{"hero_headline": "Premium Identity Platform", "hero_subheadline": "Elevated experience for discerning enterprises", "primary_cta_text": "Exclusive Access", "trust_badge_text": "Premium", "footer_disclaimer": "Premium tier requires qualification.", "primary_color": "#1C1917", "accent_color": "#D97706"}',
  '{"badge_text": "Premium", "feature_items": [{"icon": "Crown", "title": "Priority Access", "description": "Beta features first"}, {"icon": "Phone", "title": "Direct Line", "description": "Executive escalation"}, {"icon": "Sparkles", "title": "Custom Features", "description": "Bespoke development"}], "trust_items": ["Priority Support", "Early Access", "Custom Development"], "compliance_badges": ["SOC2", "ISO27001", "GDPR"]}',
  '{"primary_color": "#1C1917", "accent_color": "#D97706"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('White Label Ready', 'minimal-white-label', 'minimal_enterprise', 'published',
  '{"hero_headline": "Your Brand, Our Technology", "hero_subheadline": "White-label identity verification", "primary_cta_text": "Brand Demo", "trust_badge_text": "White Label", "footer_disclaimer": "White-label requires enterprise agreement.", "primary_color": "#27272A", "accent_color": "#EC4899"}',
  '{"badge_text": "White Label", "feature_items": [{"icon": "Palette", "title": "Full Branding", "description": "Your colors and logo"}, {"icon": "Globe", "title": "Custom Domain", "description": "Your URL"}, {"icon": "Mail", "title": "Branded Comms", "description": "Your messaging"}], "trust_items": ["Complete Branding", "API-Only Option", "No Vendor Mention"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#27272A", "accent_color": "#EC4899"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Strategic Partner', 'minimal-strategic-partner', 'minimal_enterprise', 'published',
  '{"hero_headline": "Your Strategic Identity Partner", "hero_subheadline": "Long-term partnership for identity excellence", "primary_cta_text": "Partner Inquiry", "trust_badge_text": "Strategic", "footer_disclaimer": "Strategic partnerships require evaluation.", "primary_color": "#292524", "accent_color": "#14B8A6"}',
  '{"badge_text": "Partner", "feature_items": [{"icon": "Handshake", "title": "Joint Roadmap", "description": "Shape our future"}, {"icon": "Users", "title": "Advisory Board", "description": "Industry insights"}, {"icon": "TrendingUp", "title": "Co-Marketing", "description": "Grow together"}], "trust_items": ["Product Advisory", "Joint Marketing", "Revenue Share"], "compliance_badges": ["SOC2", "ISO27001"]}',
  '{"primary_color": "#292524", "accent_color": "#14B8A6"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

-- SDK Focused Templates (8)
('Developer First', 'sdk-developer-first', 'sdk_focused', 'published',
  '{"hero_headline": "Built by Developers, for Developers", "hero_subheadline": "Clean APIs that make integration a breeze", "primary_cta_text": "View Docs", "trust_badge_text": "Dev Friendly", "footer_disclaimer": "API documentation publicly available.", "primary_color": "#22C55E", "accent_color": "#3B82F6"}',
  '{"badge_text": "Developer", "feature_items": [{"icon": "Code", "title": "RESTful API", "description": "Industry standard"}, {"icon": "Book", "title": "Full Docs", "description": "Comprehensive guides"}, {"icon": "Terminal", "title": "CLI Tools", "description": "Developer productivity"}], "trust_items": ["Open API Spec", "Postman Collection", "SDK Libraries"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#22C55E", "accent_color": "#3B82F6"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('API Gateway', 'sdk-api-gateway', 'sdk_focused', 'published',
  '{"hero_headline": "Identity API Gateway", "hero_subheadline": "One API for all your identity needs", "primary_cta_text": "Get API Key", "trust_badge_text": "API First", "footer_disclaimer": "API access requires developer account.", "primary_color": "#6366F1", "accent_color": "#EC4899"}',
  '{"badge_text": "API First", "feature_items": [{"icon": "Zap", "title": "Fast Response", "description": "Sub-100ms average"}, {"icon": "Lock", "title": "Secure Auth", "description": "OAuth 2.0 and API keys"}, {"icon": "Activity", "title": "99.99% Uptime", "description": "Enterprise SLA"}], "trust_items": ["REST & GraphQL", "Webhook Events", "Rate Limiting"], "compliance_badges": ["SOC2", "ISO27001"]}',
  '{"primary_color": "#6366F1", "accent_color": "#EC4899"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Integration Hub', 'sdk-integration-hub', 'sdk_focused', 'published',
  '{"hero_headline": "Connect Everything", "hero_subheadline": "Pre-built integrations for your stack", "primary_cta_text": "Browse Integrations", "trust_badge_text": "200+ Integrations", "footer_disclaimer": "Integration availability varies by plan.", "primary_color": "#8B5CF6", "accent_color": "#F59E0B"}',
  '{"badge_text": "Integrations", "feature_items": [{"icon": "Plug", "title": "200+ Connectors", "description": "Pre-built integrations"}, {"icon": "Webhook", "title": "Webhooks", "description": "Real-time events"}, {"icon": "Workflow", "title": "Zapier & More", "description": "No-code options"}], "trust_items": ["Salesforce", "HubSpot", "Zendesk", "Slack"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#8B5CF6", "accent_color": "#F59E0B"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('React SDK', 'sdk-react-sdk', 'sdk_focused', 'published',
  '{"hero_headline": "React Components for Identity", "hero_subheadline": "Drop-in components that just work", "primary_cta_text": "npm install", "trust_badge_text": "React Ready", "footer_disclaimer": "Open source React components.", "primary_color": "#61DAFB", "accent_color": "#7C3AED"}',
  '{"badge_text": "React", "feature_items": [{"icon": "Package", "title": "npm Package", "description": "Easy installation"}, {"icon": "Palette", "title": "Customizable", "description": "Theme support"}, {"icon": "Smartphone", "title": "Responsive", "description": "Mobile friendly"}], "trust_items": ["TypeScript", "Storybook", "Unit Tests"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#61DAFB", "accent_color": "#7C3AED"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Mobile SDK', 'sdk-mobile-sdk', 'sdk_focused', 'published',
  '{"hero_headline": "Native Mobile Identity", "hero_subheadline": "iOS and Android SDKs for mobile apps", "primary_cta_text": "Download SDK", "trust_badge_text": "Mobile Native", "footer_disclaimer": "SDKs support iOS 13+ and Android 8+.", "primary_color": "#10B981", "accent_color": "#3B82F6"}',
  '{"badge_text": "Mobile", "feature_items": [{"icon": "Smartphone", "title": "Native SDKs", "description": "iOS and Android"}, {"icon": "Camera", "title": "Camera Ready", "description": "Document capture"}, {"icon": "Fingerprint", "title": "Biometrics", "description": "Face and touch"}], "trust_items": ["Swift & Kotlin", "React Native", "Flutter"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#10B981", "accent_color": "#3B82F6"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Serverless Ready', 'sdk-serverless-ready', 'sdk_focused', 'published',
  '{"hero_headline": "Identity for Serverless", "hero_subheadline": "Edge-ready verification at scale", "primary_cta_text": "Deploy Now", "trust_badge_text": "Edge Ready", "footer_disclaimer": "Compatible with major edge platforms.", "primary_color": "#F59E0B", "accent_color": "#8B5CF6"}',
  '{"badge_text": "Serverless", "feature_items": [{"icon": "Cloud", "title": "Edge Functions", "description": "Vercel, Cloudflare"}, {"icon": "Zap", "title": "Cold Start", "description": "Under 50ms"}, {"icon": "Globe", "title": "Global CDN", "description": "200+ locations"}], "trust_items": ["Vercel", "Cloudflare", "AWS Lambda"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#F59E0B", "accent_color": "#8B5CF6"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('GraphQL API', 'sdk-graphql-api', 'sdk_focused', 'published',
  '{"hero_headline": "GraphQL-First Identity", "hero_subheadline": "Query exactly what you need", "primary_cta_text": "Open Playground", "trust_badge_text": "GraphQL", "footer_disclaimer": "GraphQL playground available.", "primary_color": "#E535AB", "accent_color": "#10B981"}',
  '{"badge_text": "GraphQL", "feature_items": [{"icon": "Database", "title": "Type Safe", "description": "Schema-first design"}, {"icon": "Filter", "title": "Flexible Queries", "description": "Get what you need"}, {"icon": "RefreshCw", "title": "Subscriptions", "description": "Real-time updates"}], "trust_items": ["Apollo Compatible", "Code Generation", "Introspection"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#E535AB", "accent_color": "#10B981"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Low Code', 'sdk-low-code', 'sdk_focused', 'published',
  '{"hero_headline": "No-Code Identity Flows", "hero_subheadline": "Visual builder for identity verification", "primary_cta_text": "Try Builder", "trust_badge_text": "No Code", "footer_disclaimer": "Visual builder included in all plans.", "primary_color": "#0EA5E9", "accent_color": "#F59E0B"}',
  '{"badge_text": "No Code", "feature_items": [{"icon": "Layout", "title": "Drag & Drop", "description": "Visual workflow"}, {"icon": "Sparkles", "title": "Pre-built Flows", "description": "Quick start"}, {"icon": "Code", "title": "Export Code", "description": "Graduate to code"}], "trust_items": ["Bubble", "Webflow", "WordPress"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#0EA5E9", "accent_color": "#F59E0B"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

-- Global Reach Templates (7)
('Worldwide Verify', 'global-worldwide-verify', 'global_reach', 'published',
  '{"hero_headline": "Verify Users Worldwide", "hero_subheadline": "Global identity coverage in 200+ countries", "primary_cta_text": "See Coverage", "trust_badge_text": "200+ Countries", "footer_disclaimer": "Coverage varies by document type.", "primary_color": "#3B82F6", "accent_color": "#10B981"}',
  '{"badge_text": "Global", "feature_items": [{"icon": "Globe", "title": "200+ Countries", "description": "Worldwide coverage"}, {"icon": "FileText", "title": "10K+ Documents", "description": "All ID types"}, {"icon": "Languages", "title": "50+ Languages", "description": "Native support"}], "trust_items": ["Americas", "EMEA", "APAC"], "compliance_badges": ["SOC2", "GDPR", "PDPA"]}',
  '{"primary_color": "#3B82F6", "accent_color": "#10B981"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Global Coverage', 'global-coverage', 'global_reach', 'published',
  '{"hero_headline": "Identity Without Borders", "hero_subheadline": "Seamless verification across continents", "primary_cta_text": "View Map", "trust_badge_text": "Global", "footer_disclaimer": "Regional compliance included.", "primary_color": "#0EA5E9", "accent_color": "#8B5CF6"}',
  '{"badge_text": "Borderless", "feature_items": [{"icon": "Map", "title": "Multi-Region", "description": "Data residency options"}, {"icon": "Clock", "title": "24/7 Coverage", "description": "Follow the sun"}, {"icon": "Shield", "title": "Local Compliance", "description": "Regional standards"}], "trust_items": ["EU Data Centers", "US Data Centers", "APAC Data Centers"], "compliance_badges": ["GDPR", "CCPA", "PDPA"]}',
  '{"primary_color": "#0EA5E9", "accent_color": "#8B5CF6"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('International ID', 'global-international-id', 'global_reach', 'published',
  '{"hero_headline": "Every Document, Every Country", "hero_subheadline": "Support for international identity documents", "primary_cta_text": "Browse Documents", "trust_badge_text": "10K+ Docs", "footer_disclaimer": "Document database updated weekly.", "primary_color": "#7C3AED", "accent_color": "#F59E0B"}',
  '{"badge_text": "Documents", "feature_items": [{"icon": "CreditCard", "title": "Passports", "description": "All countries"}, {"icon": "IdCard", "title": "National IDs", "description": "Regional formats"}, {"icon": "Car", "title": "Drivers Licenses", "description": "State and national"}], "trust_items": ["Passport MRZ", "NFC Chip Read", "Visual Verification"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#7C3AED", "accent_color": "#F59E0B"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Multilingual Platform', 'global-multilingual', 'global_reach', 'published',
  '{"hero_headline": "Your Language, Your Experience", "hero_subheadline": "Native language support for global users", "primary_cta_text": "See Languages", "trust_badge_text": "50+ Languages", "footer_disclaimer": "Translation quality guaranteed.", "primary_color": "#EC4899", "accent_color": "#10B981"}',
  '{"badge_text": "Languages", "feature_items": [{"icon": "Languages", "title": "50+ Languages", "description": "Native translations"}, {"icon": "MessageCircle", "title": "RTL Support", "description": "Arabic, Hebrew"}, {"icon": "Settings", "title": "Custom Locale", "description": "Regional formats"}], "trust_items": ["Native Speakers", "Cultural Adaptation", "Continuous Updates"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#EC4899", "accent_color": "#10B981"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Cross-Border Ready', 'global-cross-border', 'global_reach', 'published',
  '{"hero_headline": "Cross-Border Identity", "hero_subheadline": "Verify users moving between countries", "primary_cta_text": "Learn More", "trust_badge_text": "Cross-Border", "footer_disclaimer": "Cross-border verification requires additional setup.", "primary_color": "#059669", "accent_color": "#3B82F6"}',
  '{"badge_text": "Cross-Border", "feature_items": [{"icon": "Plane", "title": "Travel Docs", "description": "Visa and permits"}, {"icon": "Building", "title": "Work Authorization", "description": "Employment eligibility"}, {"icon": "FileCheck", "title": "Residency", "description": "Proof of address"}], "trust_items": ["Immigration Support", "Employment Auth", "Address Verification"], "compliance_badges": ["SOC2", "GDPR", "USCIS"]}',
  '{"primary_color": "#059669", "accent_color": "#3B82F6"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Regional Compliance', 'global-regional-compliance', 'global_reach', 'published',
  '{"hero_headline": "Local Laws, Global Platform", "hero_subheadline": "Compliant in every jurisdiction", "primary_cta_text": "View Compliance", "trust_badge_text": "Compliant", "footer_disclaimer": "Regional compliance continuously monitored.", "primary_color": "#1E40AF", "accent_color": "#DC2626"}',
  '{"badge_text": "Regional", "feature_items": [{"icon": "Scale", "title": "Legal Review", "description": "Local law experts"}, {"icon": "FileCheck", "title": "Certifications", "description": "Regional standards"}, {"icon": "Shield", "title": "Data Residency", "description": "In-country storage"}], "trust_items": ["EU GDPR", "Brazil LGPD", "Singapore PDPA"], "compliance_badges": ["GDPR", "LGPD", "PDPA", "POPIA"]}',
  '{"primary_color": "#1E40AF", "accent_color": "#DC2626"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Emerging Markets', 'global-emerging-markets', 'global_reach', 'published',
  '{"hero_headline": "Identity for Emerging Markets", "hero_subheadline": "Reach the next billion users", "primary_cta_text": "Explore Markets", "trust_badge_text": "Emerging", "footer_disclaimer": "Market availability expanding continuously.", "primary_color": "#F59E0B", "accent_color": "#7C3AED"}',
  '{"badge_text": "Emerging", "feature_items": [{"icon": "Smartphone", "title": "Mobile First", "description": "Low bandwidth ready"}, {"icon": "Users", "title": "Alternative IDs", "description": "Non-traditional docs"}, {"icon": "Wifi", "title": "Offline Mode", "description": "Intermittent connectivity"}], "trust_items": ["Africa", "Southeast Asia", "Latin America"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#F59E0B", "accent_color": "#7C3AED"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

-- Security First Templates (8)
('Zero Trust', 'security-zero-trust', 'security_first', 'published',
  '{"hero_headline": "Zero-Trust Identity Architecture", "hero_subheadline": "Never trust, always verify", "primary_cta_text": "Security Whitepaper", "trust_badge_text": "Zero Trust", "footer_disclaimer": "Security architecture documentation available.", "primary_color": "#DC2626", "accent_color": "#1E40AF"}',
  '{"badge_text": "Zero Trust", "feature_items": [{"icon": "Shield", "title": "Continuous Auth", "description": "Every request verified"}, {"icon": "Lock", "title": "Least Privilege", "description": "Minimal access"}, {"icon": "Eye", "title": "Full Visibility", "description": "Complete audit trail"}], "trust_items": ["NIST Framework", "Microsegmentation", "Device Trust"], "compliance_badges": ["SOC2", "ISO27001", "NIST"]}',
  '{"primary_color": "#DC2626", "accent_color": "#1E40AF"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Encryption Grade', 'security-encryption-grade', 'security_first', 'published',
  '{"hero_headline": "Military-Grade Encryption", "hero_subheadline": "AES-256 encryption at rest and in transit", "primary_cta_text": "View Security", "trust_badge_text": "AES-256", "footer_disclaimer": "Encryption standards exceed industry requirements.", "primary_color": "#0F172A", "accent_color": "#10B981"}',
  '{"badge_text": "Encrypted", "feature_items": [{"icon": "Lock", "title": "AES-256", "description": "Bank-grade encryption"}, {"icon": "Key", "title": "HSM Backed", "description": "Hardware security"}, {"icon": "RefreshCw", "title": "Key Rotation", "description": "Automatic rotation"}], "trust_items": ["FIPS 140-2", "HSM Protected", "TLS 1.3"], "compliance_badges": ["SOC2", "ISO27001", "FIPS"]}',
  '{"primary_color": "#0F172A", "accent_color": "#10B981"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Cyber Shield', 'security-cyber-shield', 'security_first', 'published',
  '{"hero_headline": "Advanced Threat Protection", "hero_subheadline": "Defense against sophisticated attacks", "primary_cta_text": "Threat Intel", "trust_badge_text": "Protected", "footer_disclaimer": "Threat intelligence updated in real-time.", "primary_color": "#7C2D12", "accent_color": "#F59E0B"}',
  '{"badge_text": "Threat Intel", "feature_items": [{"icon": "AlertTriangle", "title": "Threat Detection", "description": "AI-powered monitoring"}, {"icon": "Shield", "title": "DDoS Protection", "description": "Always-on defense"}, {"icon": "Bug", "title": "Pen Testing", "description": "Regular assessments"}], "trust_items": ["Bug Bounty", "Red Team", "SOC 24/7"], "compliance_badges": ["SOC2", "ISO27001"]}',
  '{"primary_color": "#7C2D12", "accent_color": "#F59E0B"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Biometric Secure', 'security-biometric-secure', 'security_first', 'published',
  '{"hero_headline": "Biometric Identity Security", "hero_subheadline": "Face, voice, and fingerprint verification", "primary_cta_text": "Try Biometrics", "trust_badge_text": "Biometric", "footer_disclaimer": "Biometric data handled per regulations.", "primary_color": "#4338CA", "accent_color": "#EC4899"}',
  '{"badge_text": "Biometric", "feature_items": [{"icon": "Scan", "title": "Face Match", "description": "Liveness detection"}, {"icon": "Mic", "title": "Voice Print", "description": "Voice biometrics"}, {"icon": "Fingerprint", "title": "Touch ID", "description": "Fingerprint matching"}], "trust_items": ["BIPA Compliant", "ISO 30107", "PAD Level 2"], "compliance_badges": ["SOC2", "ISO30107", "BIPA"]}',
  '{"primary_color": "#4338CA", "accent_color": "#EC4899"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Fraud Prevention', 'security-fraud-prevention', 'security_first', 'published',
  '{"hero_headline": "Stop Fraud Before It Starts", "hero_subheadline": "AI-powered fraud detection and prevention", "primary_cta_text": "See Demo", "trust_badge_text": "Anti-Fraud", "footer_disclaimer": "Fraud prevention effectiveness varies by use case.", "primary_color": "#B91C1C", "accent_color": "#0EA5E9"}',
  '{"badge_text": "Anti-Fraud", "feature_items": [{"icon": "AlertCircle", "title": "Real-Time Alerts", "description": "Instant notifications"}, {"icon": "Brain", "title": "ML Detection", "description": "Pattern recognition"}, {"icon": "UserX", "title": "Synthetic ID", "description": "Fake identity detection"}], "trust_items": ["99.9% Accuracy", "ML Models", "Consortium Data"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#B91C1C", "accent_color": "#0EA5E9"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Privacy First', 'security-privacy-first', 'security_first', 'published',
  '{"hero_headline": "Privacy by Design", "hero_subheadline": "Your users data is sacred", "primary_cta_text": "Privacy Policy", "trust_badge_text": "Privacy", "footer_disclaimer": "Privacy practices exceed regulatory requirements.", "primary_color": "#065F46", "accent_color": "#8B5CF6"}',
  '{"badge_text": "Privacy", "feature_items": [{"icon": "EyeOff", "title": "Data Minimization", "description": "Collect only needed"}, {"icon": "Trash2", "title": "Auto-Delete", "description": "Retention policies"}, {"icon": "Lock", "title": "Anonymization", "description": "De-identification"}], "trust_items": ["Privacy Shield", "DPO Appointed", "DPIA Complete"], "compliance_badges": ["GDPR", "CCPA", "SOC2"]}',
  '{"primary_color": "#065F46", "accent_color": "#8B5CF6"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Secure Access', 'security-secure-access', 'security_first', 'published',
  '{"hero_headline": "Secure Access Management", "hero_subheadline": "Control who accesses what, when", "primary_cta_text": "Access Demo", "trust_badge_text": "IAM", "footer_disclaimer": "Access management requires configuration.", "primary_color": "#1E3A5F", "accent_color": "#22C55E"}',
  '{"badge_text": "Access", "feature_items": [{"icon": "Key", "title": "SSO Ready", "description": "SAML and OIDC"}, {"icon": "Users", "title": "RBAC", "description": "Role-based access"}, {"icon": "Clock", "title": "Session Management", "description": "Timeout controls"}], "trust_items": ["Okta Partner", "Azure AD", "Google Workspace"], "compliance_badges": ["SOC2", "ISO27001"]}',
  '{"primary_color": "#1E3A5F", "accent_color": "#22C55E"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

('Compliance Automation', 'security-compliance-auto', 'security_first', 'published',
  '{"hero_headline": "Automated Security Compliance", "hero_subheadline": "Continuous compliance monitoring", "primary_cta_text": "See Platform", "trust_badge_text": "Automated", "footer_disclaimer": "Automation reduces but does not eliminate compliance work.", "primary_color": "#0D9488", "accent_color": "#F59E0B"}',
  '{"badge_text": "Automated", "feature_items": [{"icon": "Bot", "title": "Auto Scanning", "description": "Continuous checks"}, {"icon": "FileCheck", "title": "Evidence Collection", "description": "Audit ready"}, {"icon": "Bell", "title": "Drift Alerts", "description": "Real-time notifications"}], "trust_items": ["Policy as Code", "Auto Remediation", "Audit Reports"], "compliance_badges": ["SOC2", "ISO27001", "HIPAA"]}',
  '{"primary_color": "#0D9488", "accent_color": "#F59E0B"}',
  '{"hero": true, "features": true, "pricing": false, "trust_badges": true, "testimonials": false, "compliance": true, "footer": true}'),

-- Conversion Optimized Templates (7)
('Growth Engine', 'conversion-growth-engine', 'conversion_optimized', 'published',
  '{"hero_headline": "Accelerate Your Growth", "hero_subheadline": "Convert more visitors into verified users", "primary_cta_text": "Start Growing", "trust_badge_text": "Growth", "footer_disclaimer": "Results vary based on implementation.", "primary_color": "#10B981", "accent_color": "#F59E0B"}',
  '{"badge_text": "Growth", "feature_items": [{"icon": "TrendingUp", "title": "Higher Conversion", "description": "Reduce drop-off"}, {"icon": "Zap", "title": "Fast Verification", "description": "Under 30 seconds"}, {"icon": "Users", "title": "User Experience", "description": "Frictionless flow"}], "trust_items": ["90%+ Completion", "Mobile Optimized", "A/B Tested"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#10B981", "accent_color": "#F59E0B"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

('Funnel Pro', 'conversion-funnel-pro', 'conversion_optimized', 'published',
  '{"hero_headline": "Optimize Your Funnel", "hero_subheadline": "Remove friction at every step", "primary_cta_text": "Analyze Funnel", "trust_badge_text": "Optimized", "footer_disclaimer": "Funnel optimization requires analytics setup.", "primary_color": "#8B5CF6", "accent_color": "#EC4899"}',
  '{"badge_text": "Funnel", "feature_items": [{"icon": "Filter", "title": "Drop-Off Analysis", "description": "Find bottlenecks"}, {"icon": "Sliders", "title": "A/B Testing", "description": "Optimize flows"}, {"icon": "BarChart", "title": "Conversion Analytics", "description": "Track everything"}], "trust_items": ["Funnel Analytics", "Heat Maps", "Session Recording"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#8B5CF6", "accent_color": "#EC4899"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

('Lead Magnet', 'conversion-lead-magnet', 'conversion_optimized', 'published',
  '{"hero_headline": "Capture Every Lead", "hero_subheadline": "Progressive verification that converts", "primary_cta_text": "Get Started Free", "trust_badge_text": "Free Tier", "footer_disclaimer": "Free tier includes limited verifications.", "primary_color": "#F59E0B", "accent_color": "#10B981"}',
  '{"badge_text": "Free Tier", "feature_items": [{"icon": "Gift", "title": "Free to Start", "description": "No credit card"}, {"icon": "ArrowRight", "title": "Progressive", "description": "Verify as needed"}, {"icon": "Sparkles", "title": "Instant Setup", "description": "5-minute integration"}], "trust_items": ["No Credit Card", "Instant Access", "Upgrade Anytime"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#F59E0B", "accent_color": "#10B981"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

('Quick Start', 'conversion-quick-start', 'conversion_optimized', 'published',
  '{"hero_headline": "Go Live in Minutes", "hero_subheadline": "The fastest path to production", "primary_cta_text": "Start in 5 Minutes", "trust_badge_text": "Quick Setup", "footer_disclaimer": "Setup time varies based on integration complexity.", "primary_color": "#3B82F6", "accent_color": "#F59E0B"}',
  '{"badge_text": "Fast", "feature_items": [{"icon": "Zap", "title": "5-Minute Setup", "description": "Copy and paste"}, {"icon": "Check", "title": "Pre-Built UI", "description": "Ready to use"}, {"icon": "Book", "title": "Quick Guides", "description": "Step by step"}], "trust_items": ["Instant Sandbox", "Test Credentials", "Live in Minutes"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#3B82F6", "accent_color": "#F59E0B"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

('Trial Ready', 'conversion-trial-ready', 'conversion_optimized', 'published',
  '{"hero_headline": "Try Before You Buy", "hero_subheadline": "Full-featured trial with real verifications", "primary_cta_text": "Start Free Trial", "trust_badge_text": "14-Day Trial", "footer_disclaimer": "Trial includes full feature access.", "primary_color": "#7C3AED", "accent_color": "#10B981"}',
  '{"badge_text": "Trial", "feature_items": [{"icon": "Calendar", "title": "14 Days Free", "description": "Full access"}, {"icon": "CreditCard", "title": "No Card Required", "description": "Risk free"}, {"icon": "Headphones", "title": "Trial Support", "description": "Guided setup"}], "trust_items": ["Full Features", "Real Verifications", "Export Data"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#7C3AED", "accent_color": "#10B981"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

('Demo First', 'conversion-demo-first', 'conversion_optimized', 'published',
  '{"hero_headline": "See It In Action", "hero_subheadline": "Interactive demo, no signup required", "primary_cta_text": "Try Live Demo", "trust_badge_text": "Live Demo", "footer_disclaimer": "Demo uses sample data.", "primary_color": "#EC4899", "accent_color": "#3B82F6"}',
  '{"badge_text": "Demo", "feature_items": [{"icon": "Play", "title": "Interactive Demo", "description": "Try it now"}, {"icon": "UserCheck", "title": "Sample Flow", "description": "Full experience"}, {"icon": "Share2", "title": "Share Demo", "description": "Show your team"}], "trust_items": ["No Signup", "Real Experience", "Instant Access"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#EC4899", "accent_color": "#3B82F6"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}'),

('ROI Calculator', 'conversion-roi-calculator', 'conversion_optimized', 'published',
  '{"hero_headline": "Calculate Your Savings", "hero_subheadline": "See the ROI before you commit", "primary_cta_text": "Calculate ROI", "trust_badge_text": "ROI Tool", "footer_disclaimer": "ROI estimates based on industry averages.", "primary_color": "#059669", "accent_color": "#F59E0B"}',
  '{"badge_text": "ROI", "feature_items": [{"icon": "Calculator", "title": "ROI Calculator", "description": "Estimate savings"}, {"icon": "DollarSign", "title": "Cost Comparison", "description": "vs alternatives"}, {"icon": "PieChart", "title": "Business Case", "description": "Exportable report"}], "trust_items": ["Industry Benchmarks", "Custom Analysis", "PDF Export"], "compliance_badges": ["SOC2", "GDPR"]}',
  '{"primary_color": "#059669", "accent_color": "#F59E0B"}',
  '{"hero": true, "features": true, "pricing": true, "trust_badges": true, "testimonials": true, "compliance": true, "footer": true}');