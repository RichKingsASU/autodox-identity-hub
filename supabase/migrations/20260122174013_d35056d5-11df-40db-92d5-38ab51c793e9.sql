-- Drop existing restrictive SELECT policies on applications
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;

-- Create permissive SELECT policies (OR logic - either condition grants access)
CREATE POLICY "Admins can view all applications"
ON applications
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own applications"
ON applications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);