-- Add page progress tracking columns for chunked PDF extraction
ALTER TABLE lab_uploads
  ADD COLUMN IF NOT EXISTS current_page INTEGER,
  ADD COLUMN IF NOT EXISTS total_pages INTEGER;

-- Update processing_stage constraint to include 'splitting_pages'
ALTER TABLE lab_uploads
  DROP CONSTRAINT IF EXISTS lab_uploads_processing_stage_check;

ALTER TABLE lab_uploads
  ADD CONSTRAINT lab_uploads_processing_stage_check
  CHECK (processing_stage IN (
    'fetching_pdf',
    'splitting_pages',
    'extracting_gemini',
    'verifying_gpt',
    'post_processing'
  ) OR processing_stage IS NULL);

-- Add comment for documentation
COMMENT ON COLUMN lab_uploads.current_page IS 'Current page being processed (1-indexed) for chunked extraction';
COMMENT ON COLUMN lab_uploads.total_pages IS 'Total number of pages in the PDF for chunked extraction';
