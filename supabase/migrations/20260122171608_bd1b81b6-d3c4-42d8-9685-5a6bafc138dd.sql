-- Allow admins to view all applications
CREATE POLICY "Admins can view all applications"
  ON public.applications
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Allow admins to update application status
CREATE POLICY "Admins can update applications"
  ON public.applications
  FOR UPDATE
  USING (is_admin(auth.uid()));