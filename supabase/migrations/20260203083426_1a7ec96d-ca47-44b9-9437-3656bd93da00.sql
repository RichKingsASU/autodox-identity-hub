-- Phase 1: Production-Grade Email & Domain Infrastructure

-- 1.1 Create brand_email_settings table for per-brand email configuration
CREATE TABLE public.brand_email_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  from_name TEXT NOT NULL DEFAULT 'Agent Institute',
  from_email TEXT NOT NULL DEFAULT 'noreply@email.agents-institute.com',
  reply_to_email TEXT,
  sending_domain TEXT,
  sending_domain_status TEXT DEFAULT 'pending' CHECK (sending_domain_status IN ('pending', 'verified', 'failed')),
  custom_api_key TEXT, -- Encrypted, only readable by service role
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(brand_id)
);

-- 1.2 Create debug_logs table for centralized error tracking
CREATE TABLE public.debug_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  error_type TEXT NOT NULL DEFAULT 'error' CHECK (error_type IN ('error', 'warning', 'info')),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  request_payload JSONB,
  response_status INTEGER,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 1.3 Create email_logs table for audit trail (replacing the reference in send-email)
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_key TEXT,
  resend_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'bounced')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 1.4 Add last_notified_at columns to existing tables
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.contact_submissions ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on all new tables
ALTER TABLE public.brand_email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_email_settings
CREATE POLICY "Admins can view all brand email settings"
  ON public.brand_email_settings FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert brand email settings"
  ON public.brand_email_settings FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update brand email settings"
  ON public.brand_email_settings FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete brand email settings"
  ON public.brand_email_settings FOR DELETE
  USING (is_admin(auth.uid()));

-- RLS Policies for debug_logs (admin-only view)
CREATE POLICY "Admins can view debug logs"
  ON public.debug_logs FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role can insert debug logs"
  ON public.debug_logs FOR INSERT
  WITH CHECK (true); -- Edge functions use service role

-- RLS Policies for email_logs (admin-only view)
CREATE POLICY "Admins can view email logs"
  ON public.email_logs FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role can insert email logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (true); -- Edge functions use service role

-- Create updated_at trigger for brand_email_settings
CREATE TRIGGER update_brand_email_settings_updated_at
  BEFORE UPDATE ON public.brand_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_brand_email_settings_brand_id ON public.brand_email_settings(brand_id);
CREATE INDEX idx_debug_logs_function_name ON public.debug_logs(function_name);
CREATE INDEX idx_debug_logs_created_at ON public.debug_logs(created_at DESC);
CREATE INDEX idx_email_logs_brand_id ON public.email_logs(brand_id);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);