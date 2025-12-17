-- Remove the SELECT policy - users should not see their API usage data
-- This table is for internal rate limiting only, accessed by edge functions via service role
DROP POLICY IF EXISTS "Users can view their own usage " ON public.api_usage;

-- Keep the INSERT policy for edge functions that may need to insert via user context
-- But the edge functions already use service role, so we can remove this too for better security
DROP POLICY IF EXISTS "Users can insert their own usage " ON public.api_usage;

-- The table will now only be accessible via service role (edge functions)
-- No user-facing access at all - this is the correct security model for rate limiting