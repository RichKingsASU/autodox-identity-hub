// Template Types - Matching Database Schema

export type LandingBaseLayout =
  | 'hero_focused'
  | 'compliance_heavy'
  | 'trust_signal_dense'
  | 'minimal_enterprise'
  | 'sdk_focused'
  | 'global_reach'
  | 'security_first'
  | 'conversion_optimized'
  | 'koala_sign'
  | 'redline_delivery';

export type TemplateStatus = 'draft' | 'published' | 'disabled';

export interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
  iconBg?: string;
  span?: string;
  large?: boolean;
}

export interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ServiceItem {
  icon: string;
  title: string;
  subtitle?: string;
  description: string;
  size?: 'small' | 'medium' | 'large';
}

export interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  company?: string;
  avatar?: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface DefaultCopy {
  // Common fields
  heroHeadline: string;
  heroSubheadline: string;
  primaryCtaText: string;
  trustBadgeText: string;
  footerDisclaimer: string;
  badgeText?: string;
  featureItems?: FeatureItem[];
  trustItems?: string[];
  complianceBadges?: string[];

  // Brand info
  brandName?: string;
  brandTagline?: string;

  // Extended hero
  heroHeadlineAccent?: string;
  secondaryCtaText?: string;

  // Section headers
  featuresSectionTitle?: string;
  featuresSectionSubtitle?: string;
  pricingSectionTitle?: string;
  pricingSectionSubtitle?: string;
  testimonialsSectionTitle?: string;
  testimonialsSectionSubtitle?: string;
  faqSectionTitle?: string;
  faqSectionSubtitle?: string;
  contactSectionTitle?: string;
  contactSectionSubtitle?: string;

  // Content arrays
  pricingPlans?: PricingPlan[];
  faqs?: FAQItem[];
  services?: ServiceItem[];
  testimonials?: TestimonialItem[];
  stats?: StatItem[];

  // Footer
  footerTagline?: string;
  copyright?: string;
}

export interface ThemeOverrides {
  primaryColor: string;
  accentColor: string;
}

export interface SectionsEnabled {
  hero: boolean;
  features: boolean;
  pricing: boolean;
  trustBadges: boolean;
  testimonials: boolean;
  compliance: boolean;
  footer: boolean;
  // Extended sections
  faq?: boolean;
  contact?: boolean;
  services?: boolean;
  about?: boolean;
  stats?: boolean;
}

export interface EditableFields {
  hero_headline: boolean;
  hero_subheadline: boolean;
  primary_cta_text: boolean;
  trust_badge_text: boolean;
  footer_disclaimer: boolean;
  primary_color: boolean;
  accent_color: boolean;
}

export interface LandingTemplate {
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

// Lightweight version for list view (no JSONB fields)
export interface LandingTemplateListItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  base_layout: LandingBaseLayout;
  version: number;
  status: TemplateStatus;
  created_at: string;
  updated_at: string;
}

export type TemplateAction = 
  | 'created' 
  | 'updated' 
  | 'applied' 
  | 'disabled' 
  | 'published' 
  | 'reverted';

export interface TemplateActivityLog {
  id: string;
  template_id: string | null;
  template_slug: string;
  brand_id: string | null;
  action: TemplateAction;
  changes: Record<string, unknown> | null;
  performed_by: string;
  performed_at: string;
}

// Props interface for all layout components
export interface LayoutProps {
  copy: DefaultCopy;
  theme: ThemeOverrides;
  sectionsEnabled: SectionsEnabled;
  previewMode?: boolean;
}

// Filter types for template list
export interface TemplateFilters {
  search?: string;
  baseLayout?: LandingBaseLayout;
  status?: TemplateStatus;
  page?: number;
  perPage?: number;
}

// Activity log filters
export interface ActivityLogFilters {
  templateId?: string;
  action?: TemplateAction;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
}

// Brand with template info
export interface BrandWithTemplate {
  id: string;
  name: string;
  slug: string;
  status: string;
  active_template_id: string | null;
  applied_template_version: number | null;
  template_applied_at: string | null;
  template_applied_by: string | null;
  previous_template_id: string | null;
  previous_template_version: number | null;
  activeTemplate?: LandingTemplateListItem | null;
}
