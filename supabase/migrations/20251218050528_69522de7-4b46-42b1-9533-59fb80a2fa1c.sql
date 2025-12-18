-- Strengthen coaching_requests SELECT policy to only allow authenticated users
-- The current policy is secure but targets 'public' role, let's make it explicitly authenticated

DROP POLICY IF EXISTS "Users view own email requests" ON public.coaching_requests;

CREATE POLICY "Users view own email requests" 
ON public.coaching_requests 
FOR SELECT 
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);