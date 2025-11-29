-- Add post_processing stage to lab_uploads processing_stage constraint
-- This stage is used for biomarker matching and unit conversion after GPT verification

ALTER TABLE lab_uploads
DROP CONSTRAINT IF EXISTS lab_uploads_processing_stage_check;

ALTER TABLE lab_uploads
ADD CONSTRAINT lab_uploads_processing_stage_check
CHECK (processing_stage IN ('fetching_pdf', 'extracting_gemini', 'verifying_gpt', 'post_processing'));
