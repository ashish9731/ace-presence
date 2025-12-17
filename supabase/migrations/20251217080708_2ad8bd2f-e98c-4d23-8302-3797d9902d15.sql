-- Create table to track API usage for rate limiting
CREATE TABLE public.api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  called_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient rate limit queries
CREATE INDEX idx_api_usage_user_function_time ON public.api_usage(user_id, function_name, called_at DESC);

-- Enable RLS
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage
CREATE POLICY "Users can view their own usage" 
ON public.api_usage 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own usage records
CREATE POLICY "Users can insert their own usage" 
ON public.api_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Auto-delete old records after 24 hours to keep table small
CREATE OR REPLACE FUNCTION public.cleanup_old_api_usage()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.api_usage WHERE called_at < NOW() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Run cleanup on every 100th insert
CREATE TRIGGER cleanup_api_usage_trigger
AFTER INSERT ON public.api_usage
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_api_usage();