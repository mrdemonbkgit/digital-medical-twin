-- Add 'partial' status to lab_uploads status constraint
-- 'partial' = extraction succeeded but post-processing failed (biomarkers not standardized)

ALTER TABLE lab_uploads
  DROP CONSTRAINT IF EXISTS lab_uploads_status_check;

ALTER TABLE lab_uploads
  ADD CONSTRAINT lab_uploads_status_check
  CHECK (status IN ('pending', 'processing', 'complete', 'partial', 'failed'));

COMMENT ON COLUMN lab_uploads.status IS
  'Upload status: pending (queued), processing (in progress), complete (full success), partial (extraction ok but post-processing failed), failed (extraction failed)';
