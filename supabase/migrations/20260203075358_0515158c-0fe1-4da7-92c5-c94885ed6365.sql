-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Super admins can delete brands" ON brands;

-- Create new policy allowing all admins to delete
CREATE POLICY "Admins can delete brands"
ON brands FOR DELETE
USING (is_admin(auth.uid()));