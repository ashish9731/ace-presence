-- CRITICAL SECURITY FIX: Make assessments.user_id NOT NULL
-- This prevents orphaned records and ensures RLS works correctly

-- First, delete any assessments with NULL user_id (orphaned records)
DELETE FROM public.assessments WHERE user_id IS NULL;

-- Make user_id NOT NULL to enforce data ownership
ALTER TABLE public.assessments 
ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key reference to ensure user_id is valid (optional but recommended)
-- Note: We don't reference auth.users directly, just ensure NOT NULL

-- Add comment documenting security requirement
COMMENT ON COLUMN public.assessments.user_id IS 'Owner of this assessment. NOT NULL enforced for RLS security.';

-- Verify all tables have RLS enabled (defensive check)
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Add restrictive policy for coaching_requests INSERT to require authentication
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can create coaching requests" ON public.coaching_requests;

-- Create a more secure INSERT policy that requires authentication
CREATE POLICY "Authenticated users can create coaching requests" 
ON public.coaching_requests 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Add comment documenting the security model
COMMENT ON TABLE public.assessments IS 'User video assessments. RLS enforces user_id = auth.uid() for all operations.';
COMMENT ON TABLE public.user_plans IS 'User subscription plans. RLS enforces user_id = auth.uid() for all operations.';
COMMENT ON TABLE public.coaching_requests IS 'Coaching session requests. RLS restricts SELECT to email match, INSERT to authenticated users.';
COMMENT ON TABLE public.api_usage IS 'API rate limiting. Internal table - RLS allows user self-insert for tracking only.';