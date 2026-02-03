-- Add test brands and domains
-- Brand 1: Retro Pawn Shop
INSERT INTO public.brands (name, slug, domain, status)
VALUES ('Retro Pawn Shop', 'retropawnshop', 'retropawnshop.com', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.domains (brand_id, domain, is_primary, status)
SELECT id, 'retropawnshop.com', true, 'verified'
FROM public.brands WHERE slug = 'retropawnshop'
ON CONFLICT (domain) DO NOTHING;

-- Brand 2: Treasure Hunt AR
INSERT INTO public.brands (name, slug, domain, status)
VALUES ('Treasure Hunt AR', 'treasurehunt-ar', 'treasurehunt-ar.com', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.domains (brand_id, domain, is_primary, status)
SELECT id, 'treasurehunt-ar.com', true, 'verified'
FROM public.brands WHERE slug = 'treasurehunt-ar'
ON CONFLICT (domain) DO NOTHING;

-- Brand 3: Never Forget Occasions
INSERT INTO public.brands (name, slug, domain, status)
VALUES ('Never Forget Occasions', 'never-forget-occasions', 'never-forget-occasions.com', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.domains (brand_id, domain, is_primary, status)
SELECT id, 'never-forget-occasions.com', true, 'verified'
FROM public.brands WHERE slug = 'never-forget-occasions'
ON CONFLICT (domain) DO NOTHING;

-- Brand 4: Find Furever Friends
INSERT INTO public.brands (name, slug, domain, status)
VALUES ('Find Furever Friends', 'findfureverfriends', 'findfureverfriends.com', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.domains (brand_id, domain, is_primary, status)
SELECT id, 'findfureverfriends.com', true, 'verified'
FROM public.brands WHERE slug = 'findfureverfriends'
ON CONFLICT (domain) DO NOTHING;
