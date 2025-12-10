-- Create storage bucket for video uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false);

-- Create storage policy for video uploads (public access for demo, no auth required)
CREATE POLICY "Anyone can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Anyone can read videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Anyone can delete videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos');

-- Create assessments table to store EP analysis results
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_url TEXT,
  video_path TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'analyzing', 'completed', 'failed')),
  
  -- Overall scores
  overall_score NUMERIC(5,2),
  communication_score NUMERIC(5,2),
  appearance_score NUMERIC(5,2),
  storytelling_score NUMERIC(5,2),
  
  -- Detailed analysis JSON
  communication_analysis JSONB,
  appearance_analysis JSONB,
  storytelling_analysis JSONB,
  
  -- Transcript
  transcript TEXT,
  
  -- Metadata
  video_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required for demo)
CREATE POLICY "Anyone can create assessments"
ON public.assessments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view assessments"
ON public.assessments FOR SELECT
USING (true);

CREATE POLICY "Anyone can update assessments"
ON public.assessments FOR UPDATE
USING (true);