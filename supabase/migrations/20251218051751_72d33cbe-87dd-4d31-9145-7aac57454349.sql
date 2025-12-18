-- Create payments table for admin approval workflow
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL DEFAULT 'upi',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT
);

-- Create video_usage table for tracking video analyses per user per month
CREATE TABLE public.video_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate usage records per assessment
CREATE UNIQUE INDEX idx_video_usage_assessment ON public.video_usage(assessment_id);

-- Create index for efficient queries
CREATE INDEX idx_video_usage_user_month ON public.video_usage(user_id, month_year);
CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments policies - users can only see and create their own payments
CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Enable RLS on video_usage table
ALTER TABLE public.video_usage ENABLE ROW LEVEL SECURITY;

-- Video usage policies - users can only see their own usage
CREATE POLICY "Users can view their own video usage"
ON public.video_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own video usage"
ON public.video_usage
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add trial_started_at and trial_ends_at to user_plans for free trial tracking
ALTER TABLE public.user_plans 
ADD COLUMN trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Comments for documentation
COMMENT ON TABLE public.payments IS 'Payment records requiring admin approval before activating paid tiers';
COMMENT ON TABLE public.video_usage IS 'Tracks video analysis usage per user per month for tier limits';
COMMENT ON COLUMN public.user_plans.trial_started_at IS 'When free trial started';
COMMENT ON COLUMN public.user_plans.trial_ends_at IS 'When free trial expires (2 days from start)';
COMMENT ON COLUMN public.user_plans.is_active IS 'Whether the plan is currently active';