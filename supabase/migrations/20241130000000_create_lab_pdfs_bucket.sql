-- Create storage bucket for lab PDFs
-- Users can only access their own files via RLS

-- Create the bucket (private, not public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lab-pdfs',
  'lab-pdfs',
  false,
  10485760,  -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can upload their own PDFs
-- Files stored as: {userId}/{filename}.pdf
CREATE POLICY "Users can upload their own PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lab-pdfs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can read their own PDFs
CREATE POLICY "Users can read their own PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lab-pdfs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can update their own PDFs
CREATE POLICY "Users can update their own PDFs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lab-pdfs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can delete their own PDFs
CREATE POLICY "Users can delete their own PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lab-pdfs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
