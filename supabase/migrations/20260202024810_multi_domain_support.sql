-- =============================================================================
-- Multi-Domain Enhancement Migration
-- Purpose: Add separate domains table for multi-brand domain management
-- Date: 2026-02-01
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1: Create Domains Table
-- -----------------------------------------------------------------------------

CREATE TABLE public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  status public.domain_status NOT NULL DEFAULT 'pending',
  verification_token TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  ssl_status TEXT,
  netlify_domain_id TEXT,
  error_message TEXT,
  dns_records JSONB, -- Store required DNS records from Netlify
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_domains_brand_id ON public.domains(brand_id);
CREATE INDEX idx_domains_domain ON public.domains(domain);
CREATE INDEX idx_domains_status ON public.domains(status);
CREATE INDEX idx_domains_is_primary ON public.domains(is_primary) WHERE is_primary = true;

-- Ensure only one primary domain per brand using partial unique index
CREATE UNIQUE INDEX idx_one_primary_per_brand ON public.domains(brand_id) WHERE is_primary = true;

-- Add comment for documentation
COMMENT ON TABLE public.domains IS 'Stores custom domains for brands with verification and SSL status tracking';
COMMENT ON COLUMN public.domains.dns_records IS 'JSON array of DNS records required for domain verification (from Netlify API)';
COMMENT ON COLUMN public.domains.netlify_domain_id IS 'Netlify domain ID for API operations';

-- -----------------------------------------------------------------------------
-- PART 2: Create Domain Events Table (Audit Trail)
-- -----------------------------------------------------------------------------

CREATE TABLE public.domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created',
    'netlify_added',
    'dns_verified',
    'ssl_provisioning',
    'ssl_provisioned',
    'activated',
    'failed',
    'removed',
    'error'
  )),
  details JSONB DEFAULT '{}',
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_domain_events_domain_id ON public.domain_events(domain_id);
CREATE INDEX idx_domain_events_created_at ON public.domain_events(created_at DESC);
CREATE INDEX idx_domain_events_event_type ON public.domain_events(event_type);

-- Add comment
COMMENT ON TABLE public.domain_events IS 'Immutable audit trail of all domain lifecycle events';

-- -----------------------------------------------------------------------------
-- PART 3: Domain Validation Function
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_domain(domain_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Check domain format (basic regex for valid domain)
  IF domain_name !~ '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for reserved/protected domains
  IF domain_name IN ('localhost', 'agents-institute.com', 'autodox.com') THEN
    RETURN FALSE;
  END IF;
  
  -- Check for common invalid patterns
  IF domain_name LIKE '%.local' OR domain_name LIKE '%.test' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.validate_domain IS 'Validates domain name format and checks against reserved domains';

-- -----------------------------------------------------------------------------
-- PART 4: Domain Lookup Function (for brand resolution)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_brand_by_domain(hostname TEXT)
RETURNS TABLE (
  brand_id UUID,
  brand_name TEXT,
  brand_slug TEXT,
  brand_settings JSONB,
  template_id UUID,
  domain_id UUID,
  is_primary BOOLEAN
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
    b.slug AS brand_slug,
    b.settings AS brand_settings,
    b.active_template_id AS template_id,
    d.id AS domain_id,
    d.is_primary
  FROM public.domains d
  INNER JOIN public.brands b ON d.brand_id = b.id
  WHERE d.domain = hostname
    AND d.status = 'active'
    AND b.status = 'active'
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_brand_by_domain IS 'Resolves hostname to active brand configuration for request routing';

-- -----------------------------------------------------------------------------
-- PART 5: Trigger for Updated At
-- -----------------------------------------------------------------------------

CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- PART 6: Enable Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- PART 7: RLS Policies - Domains
-- -----------------------------------------------------------------------------

-- Admins can manage all domains
CREATE POLICY "Admins can view all domains"
ON public.domains FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert domains"
ON public.domains FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update domains"
ON public.domains FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete domains"
ON public.domains FOR DELETE
USING (public.is_admin(auth.uid()));

-- Public can read active domains (for domain resolution)
CREATE POLICY "Public can read active domains"
ON public.domains FOR SELECT
USING (status = 'active');

-- Brand owners can view their brand's domains
CREATE POLICY "Brand owners can view their domains"
ON public.domains FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = domains.brand_id
    AND brands.owner_user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- PART 8: RLS Policies - Domain Events
-- -----------------------------------------------------------------------------

-- Admins can view all events
CREATE POLICY "Admins can view domain events"
ON public.domain_events FOR SELECT
USING (public.is_admin(auth.uid()));

-- System can insert events (via service role)
CREATE POLICY "System can insert domain events"
ON public.domain_events FOR INSERT
WITH CHECK (true);

-- Prevent updates and deletes (immutable audit trail)
CREATE POLICY "Domain events are immutable"
ON public.domain_events FOR UPDATE
USING (false);

CREATE POLICY "Domain events cannot be deleted"
ON public.domain_events FOR DELETE
USING (false);

-- -----------------------------------------------------------------------------
-- PART 9: Data Migration (Optional - migrate existing domain data)
-- -----------------------------------------------------------------------------

-- Migrate existing domains from brands table to domains table
INSERT INTO public.domains (brand_id, domain, is_primary, status, verification_token, verified_at, ssl_status)
SELECT 
  id AS brand_id,
  domain,
  true AS is_primary,
  COALESCE(domain_status, 'pending') AS status,
  domain_verification_token,
  domain_verified_at,
  ssl_status
FROM public.brands
WHERE domain IS NOT NULL
ON CONFLICT (domain) DO NOTHING;

-- Log migration events
INSERT INTO public.domain_events (domain_id, event_type, details, performed_by)
SELECT 
  d.id,
  'created',
  jsonb_build_object('source', 'migration', 'migrated_at', now()),
  NULL
FROM public.domains d
WHERE d.created_at >= (now() - interval '1 minute');

-- -----------------------------------------------------------------------------
-- PART 10: Add Realtime Support
-- -----------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.domains;
ALTER PUBLICATION supabase_realtime ADD TABLE public.domain_events;

-- =============================================================================
-- Migration Complete
-- =============================================================================
