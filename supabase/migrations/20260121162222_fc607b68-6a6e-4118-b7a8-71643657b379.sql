-- Add policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (is_admin(auth.uid()));

-- Add policy for admins to update profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (is_admin(auth.uid()));