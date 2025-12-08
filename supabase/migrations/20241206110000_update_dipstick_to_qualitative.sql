-- Migration: Update dipstick urinalysis biomarkers to qualitative
-- These biomarkers represent dipstick/chemical analysis results which are qualitative (Negative/Positive/Trace/+/++/+++)
-- Separate microscopy biomarkers with numeric values exist for RBC/WBC counts

-- Update dipstick biomarkers to qualitative unit
-- Note: We're keeping the reference_ranges structure but they won't be used for qualitative results

UPDATE public.biomarker_standards
SET
  standard_unit = 'qualitative',
  unit_conversions = '{}'::jsonb,
  updated_at = NOW()
WHERE code IN (
  'urine_blood',     -- Dipstick blood detection (hemoglobin)
  'urine_wbc',       -- Dipstick leukocyte esterase
  'urine_protein',   -- Dipstick protein
  'urine_glucose',   -- Dipstick glucose
  'urine_ketones',   -- Dipstick ketones
  'urine_bilirubin', -- Dipstick bilirubin
  'urobilinogen'     -- Dipstick urobilinogen
);

-- Update names to clarify these are dipstick results
UPDATE public.biomarker_standards SET name = 'Urine Blood (Dipstick)', updated_at = NOW() WHERE code = 'urine_blood';
UPDATE public.biomarker_standards SET name = 'Urine WBC (Dipstick)', updated_at = NOW() WHERE code = 'urine_wbc';
UPDATE public.biomarker_standards SET name = 'Urine Protein (Dipstick)', updated_at = NOW() WHERE code = 'urine_protein';
UPDATE public.biomarker_standards SET name = 'Urine Glucose (Dipstick)', updated_at = NOW() WHERE code = 'urine_glucose';
UPDATE public.biomarker_standards SET name = 'Urine Ketones (Dipstick)', updated_at = NOW() WHERE code = 'urine_ketones';
UPDATE public.biomarker_standards SET name = 'Urine Bilirubin (Dipstick)', updated_at = NOW() WHERE code = 'urine_bilirubin';
UPDATE public.biomarker_standards SET name = 'Urobilinogen (Dipstick)', updated_at = NOW() WHERE code = 'urobilinogen';
