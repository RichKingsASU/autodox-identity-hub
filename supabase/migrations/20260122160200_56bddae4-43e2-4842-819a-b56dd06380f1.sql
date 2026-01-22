-- Create storage bucket for portal logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('portal-logos', 'portal-logos', true);

-- Allow admins to upload logos
CREATE POLICY "Admins can upload portal logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portal-logos' 
  AND public.is_admin(auth.uid())
);

-- Allow admins to update logos
CREATE POLICY "Admins can update portal logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portal-logos' 
  AND public.is_admin(auth.uid())
);

-- Allow admins to delete logos
CREATE POLICY "Admins can delete portal logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portal-logos' 
  AND public.is_admin(auth.uid())
);

-- Allow public read access to logos
CREATE POLICY "Anyone can view portal logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portal-logos');