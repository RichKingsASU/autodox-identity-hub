-- =============================================================================
-- Add missing RPC function for domain resolution
-- This function is called by serve-brand-landing edge function
-- =============================================================================

-- Function to get brand by domain for landing page routing
CREATE OR REPLACE FUNCTION public.get_brand_by_domain(hostname TEXT)
RETURNS TABLE (
  brand_id UUID,
  brand_name TEXT,
  brand_slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS brand_id,
    b.name AS brand_name,
    b.slug AS brand_slug
  FROM public.brands b
  WHERE b.domain = hostname
    AND b.domain_status = 'active'
    AND b.status = 'active'
  LIMIT 1;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.get_brand_by_domain(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_brand_by_domain(TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_brand_by_domain(TEXT) IS
  'Resolves a hostname to a brand for landing page routing. Returns brand_id, brand_name, and brand_slug for active domains.';
