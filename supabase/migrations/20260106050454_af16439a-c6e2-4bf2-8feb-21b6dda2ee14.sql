-- Add user_id column to coaching_requests for proper RLS
ALTER TABLE public.coaching_requests 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing insecure policies
DROP POLICY IF EXISTS "Authenticated users can create coaching requests" ON public.coaching_requests;
DROP POLICY IF EXISTS "Users view own email requests" ON public.coaching_requests;

-- Create secure policies using user_id
CREATE POLICY "Users can create their own coaching requests"
ON public.coaching_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own coaching requests"
ON public.coaching_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to view all coaching requests
CREATE POLICY "Admins can view all coaching requests"
ON public.coaching_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));