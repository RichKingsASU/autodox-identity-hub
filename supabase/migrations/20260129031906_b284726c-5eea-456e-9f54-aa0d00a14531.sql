-- Create domain status enum
CREATE TYPE public.domain_status AS ENUM (
  'pending',
  'verifying', 
  'verified',
  'provisioning_ssl',
  'active',
  'failed'
);

-- Add domain management columns to brands table
ALTER TABLE public.brands
ADD COLUMN domain_status public.domain_status DEFAULT NULL,
ADD COLUMN domain_verification_token text DEFAULT NULL,
ADD COLUMN domain_verified_at timestamp with time zone DEFAULT NULL,
ADD COLUMN ssl_status text DEFAULT NULL,
ADD COLUMN cloudflare_hostname_id text DEFAULT NULL,
ADD COLUMN domain_error text DEFAULT NULL;

-- Create index for domain lookups (for serve-brand-landing)
CREATE INDEX idx_brands_domain ON public.brands(domain) WHERE domain IS NOT NULL;

-- Create index for domain status queries
CREATE INDEX idx_brands_domain_status ON public.brands(domain_status) WHERE domain_status IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.brands.domain_status IS 'Current status of domain configuration: pending, verifying, verified, provisioning_ssl, active, failed';
COMMENT ON COLUMN public.brands.domain_verification_token IS 'Unique token for DNS TXT record verification';
COMMENT ON COLUMN public.brands.domain_verified_at IS 'Timestamp when DNS verification succeeded';
COMMENT ON COLUMN public.brands.ssl_status IS 'Cloudflare SSL certificate provisioning status';
COMMENT ON COLUMN public.brands.cloudflare_hostname_id IS 'Cloudflare custom hostname ID for management';
COMMENT ON COLUMN public.brands.domain_error IS 'Last error message if domain configuration failed';