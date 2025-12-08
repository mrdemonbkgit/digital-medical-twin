-- Migration: Fix inverted/incorrect unit conversion factors
-- The formula is: value_in_standard = value_in_source × factor
-- These factors were inverted (stored as 1/factor instead of factor)

-- Fix eAG: 1 mmol/L = 18.0182 mg/dL (was 0.0555 which is inverted)
UPDATE public.biomarker_standards
SET
  unit_conversions = '{"mmol/L": 18.0182}'::jsonb,
  updated_at = NOW()
WHERE code = 'eag';

-- Fix Total Testosterone: 1 nmol/L = 28.84 ng/dL (was 0.0347 which is inverted)
UPDATE public.biomarker_standards
SET
  unit_conversions = '{"nmol/L": 28.84}'::jsonb,
  updated_at = NOW()
WHERE code = 'testosterone_total';

-- Fix Free Testosterone: 1 pmol/L = 0.2884 pg/mL (was 0.0347 which is wrong scale)
-- Note: 1 nmol/L = 288.4 pg/mL, so 1 pmol/L = 0.2884 pg/mL
UPDATE public.biomarker_standards
SET
  unit_conversions = '{"pmol/L": 0.2884}'::jsonb,
  updated_at = NOW()
WHERE code = 'testosterone_free';

-- Fix Creatinine (Urine): 1 mmol/L = 8.84 mg/dL (was 0.0884 which is for μmol/L)
-- Note: 1 μmol/L = 0.01131 mg/dL, so 1 mmol/L = 11.31 mg/dL
-- Actually for creatinine: 1 mg/dL = 88.4 μmol/L, so 1 mmol/L = 11.31 mg/dL
UPDATE public.biomarker_standards
SET
  unit_conversions = '{"mmol/L": 11.31, "μmol/L": 0.01131, "umol/L": 0.01131}'::jsonb,
  updated_at = NOW()
WHERE code = 'creatinine_urine';

-- Also check and fix serum creatinine if needed
UPDATE public.biomarker_standards
SET
  unit_conversions = '{"mmol/L": 11.31, "μmol/L": 0.01131, "umol/L": 0.01131}'::jsonb,
  updated_at = NOW()
WHERE code = 'creatinine' AND standard_unit = 'mg/dL';
