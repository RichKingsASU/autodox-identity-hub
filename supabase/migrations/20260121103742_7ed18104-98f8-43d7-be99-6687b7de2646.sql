-- Fix: Deny anonymous/unauthenticated access to profiles table
-- The existing policies use auth.uid() = user_id, but we should also explicitly deny anon access

-- Drop existing SELECT policy and recreate with explicit auth check
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);