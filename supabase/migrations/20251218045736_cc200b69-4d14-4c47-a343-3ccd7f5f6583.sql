-- Add input validation constraints to coaching_requests table
-- These provide defense-in-depth alongside edge function validation

-- Email format validation using regex
ALTER TABLE public.coaching_requests
ADD CONSTRAINT valid_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Length constraints for all fields
ALTER TABLE public.coaching_requests
ADD CONSTRAINT name_max_length CHECK (length(name) <= 100);

ALTER TABLE public.coaching_requests
ADD CONSTRAINT email_max_length CHECK (length(email) <= 255);

ALTER TABLE public.coaching_requests
ADD CONSTRAINT primary_goal_max_length CHECK (primary_goal IS NULL OR length(primary_goal) <= 500);

ALTER TABLE public.coaching_requests
ADD CONSTRAINT preferred_times_max_length CHECK (preferred_times IS NULL OR length(preferred_times) <= 200);

ALTER TABLE public.coaching_requests
ADD CONSTRAINT notes_max_length CHECK (notes IS NULL OR length(notes) <= 1000);