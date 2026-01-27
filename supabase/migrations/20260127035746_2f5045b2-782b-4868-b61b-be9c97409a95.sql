-- Allow anyone to read published templates (they're public configuration)
CREATE POLICY "Anyone can view published templates"
ON public.landing_templates
FOR SELECT
TO anon, authenticated
USING (status = 'published');