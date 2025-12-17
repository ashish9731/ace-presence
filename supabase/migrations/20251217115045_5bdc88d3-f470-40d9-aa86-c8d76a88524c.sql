-- Create coaching_requests table
CREATE TABLE public.coaching_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  primary_goal TEXT,
  preferred_times TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.coaching_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own requests
CREATE POLICY "Users can create coaching requests" 
ON public.coaching_requests 
FOR INSERT 
WITH CHECK (true);

-- Allow authenticated users to view their own requests (by email)
CREATE POLICY "Users can view their requests" 
ON public.coaching_requests 
FOR SELECT 
USING (true);