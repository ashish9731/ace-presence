-- Fix coaching_requests SELECT policy to restrict access by email
-- This prevents any authenticated user from viewing all coaching requests

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view their requests" ON public.coaching_requests;

-- Create new policy that restricts SELECT to requests matching the user's email
CREATE POLICY "Users view own email requests" 
ON public.coaching_requests 
FOR SELECT 
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));