-- Sync primary domain info back to brands table for backward compatibility
CREATE OR REPLACE FUNCTION public.sync_brand_primary_domain()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        UPDATE public.brands
        SET 
            domain = NULL,
            domain_status = NULL,
            domain_verification_token = NULL,
            domain_verified_at = NULL,
            ssl_status = NULL,
            cloudflare_hostname_id = NULL,
            domain_error = NULL
        WHERE id = OLD.brand_id;
        RETURN OLD;
    END IF;

    IF (NEW.is_primary = true) THEN
        UPDATE public.brands
        SET 
            domain = NEW.domain,
            domain_status = NEW.status,
            domain_verification_token = NEW.verification_token,
            domain_verified_at = NEW.verified_at,
            ssl_status = NEW.ssl_status,
            cloudflare_hostname_id = NEW.netlify_domain_id,
            domain_error = NEW.error_message
        WHERE id = NEW.brand_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_domain_change
AFTER INSERT OR UPDATE OR DELETE ON public.domains
FOR EACH ROW EXECUTE FUNCTION public.sync_brand_primary_domain();

-- Initial sync
UPDATE public.brands b
SET 
    domain = d.domain,
    domain_status = d.status,
    domain_verification_token = d.verification_token,
    domain_verified_at = d.verified_at,
    ssl_status = d.ssl_status,
    cloudflare_hostname_id = d.netlify_domain_id,
    domain_error = d.error_message
FROM public.domains d
WHERE b.id = d.brand_id AND d.is_primary = true;
