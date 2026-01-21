-- Create app_role enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create brand_status enum
CREATE TYPE public.brand_status AS ENUM ('provisioning', 'active', 'suspended', 'archived');

-- Create brands table for multi-tenant management
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  status brand_status NOT NULL DEFAULT 'provisioning',
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  monthly_sms_limit INTEGER DEFAULT 10000,
  current_month_usage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is any admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin')
  )
$$;

-- RLS policies for user_roles (only admins can view/manage)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS policies for brands
CREATE POLICY "Admins can view all brands"
ON public.brands
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert brands"
ON public.brands
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update brands"
ON public.brands
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can delete brands"
ON public.brands
FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Brand owners can view their own brand
CREATE POLICY "Brand owners can view their brand"
ON public.brands
FOR SELECT
USING (auth.uid() = owner_user_id);

-- Trigger for updated_at on brands
CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();