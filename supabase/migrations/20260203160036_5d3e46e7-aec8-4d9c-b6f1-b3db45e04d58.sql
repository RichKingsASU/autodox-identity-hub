-- Add UNIQUE constraint on brands.domain to prevent duplicate domains
CREATE UNIQUE INDEX IF NOT EXISTS brands_domain_unique 
ON brands(domain) 
WHERE domain IS NOT NULL;