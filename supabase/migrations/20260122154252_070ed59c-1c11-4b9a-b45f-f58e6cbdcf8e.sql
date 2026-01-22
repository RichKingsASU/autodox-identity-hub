-- Create portal_configs table for white-label theming
CREATE TABLE public.portal_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  brand_name TEXT NOT NULL DEFAULT 'My Portal',
  primary_color TEXT NOT NULL DEFAULT '#8B5CF6',
  secondary_color TEXT NOT NULL DEFAULT '#EC4899',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.portal_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage all portal configs
CREATE POLICY "Admins can manage all portal configs"
  ON public.portal_configs
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- RLS Policy: Users can view their own portal config
CREATE POLICY "Users can view their own portal config"
  ON public.portal_configs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_portal_configs_updated_at
  BEFORE UPDATE ON public.portal_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster user lookups
CREATE INDEX idx_portal_configs_user_id ON public.portal_configs(user_id);