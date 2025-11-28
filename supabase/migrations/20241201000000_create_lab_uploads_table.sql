-- Create lab_uploads table for queuing and tracking PDF extraction jobs
CREATE TABLE IF NOT EXISTS public.lab_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- File info
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,

  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  processing_stage TEXT
    CHECK (processing_stage IN ('fetching_pdf', 'extracting_gemini', 'verifying_gpt')),
  skip_verification BOOLEAN NOT NULL DEFAULT false,

  -- Extraction result (stored as JSONB)
  extracted_data JSONB,
  extraction_confidence DECIMAL(3,2),
  verification_passed BOOLEAN,
  corrections TEXT[],

  -- Error info
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Track if converted to event
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.lab_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only access their own uploads
-- Drop existing policy first if it exists (ignore error if not)
DROP POLICY IF EXISTS "Users can manage own uploads" ON public.lab_uploads;

CREATE POLICY "Users can manage own uploads" ON public.lab_uploads
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_lab_uploads_user_status ON public.lab_uploads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_lab_uploads_created_at ON public.lab_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_uploads_user_id ON public.lab_uploads(user_id);

-- Grant permissions
GRANT ALL ON public.lab_uploads TO authenticated;
GRANT ALL ON public.lab_uploads TO service_role;
