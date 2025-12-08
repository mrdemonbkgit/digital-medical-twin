-- Migration: Fix unit conversion factors (Batch 4)
-- Handles remaining conversions not covered by Unicode normalization
-- Formula: value_in_standard = value_in_source × factor

-- ============================================================================
-- High-sensitivity Troponin I: ng/L → ng/mL
-- Standard unit: ng/mL
-- Math: 1 ng/L = 1 ng / 1000 mL = 0.001 ng/mL
-- Factor: 0.001
-- ============================================================================
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{ng/L}',
  '0.001'::jsonb
), updated_at = NOW()
WHERE code = 'troponin_i';

-- Also update troponin_t if it exists
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{ng/L}',
  '0.001'::jsonb
), updated_at = NOW()
WHERE code = 'troponin_t';

-- ============================================================================
-- Immature Granulocytes: 10³/µL → cells/μL
-- Standard unit: cells/μL
-- Math: 1 K/uL = 1000 cells/μL (K = 10³ = 1000)
-- Note: The DB key uses 10^9/L which normalizes to K/uL
-- Factor: 1000
-- ============================================================================
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{K/uL}',
  '1000'::jsonb
), updated_at = NOW()
WHERE code = 'immature_granulocytes';

-- Also add 10^9/L variant
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{10^9/L}',
  '1000'::jsonb
), updated_at = NOW()
WHERE code = 'immature_granulocytes';

-- ============================================================================
-- Nucleated RBC: 10³/µL → cells/μL
-- Same conversion as immature granulocytes
-- Factor: 1000
-- ============================================================================
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{K/uL}',
  '1000'::jsonb
), updated_at = NOW()
WHERE code = 'nrbc';

UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{10^9/L}',
  '1000'::jsonb
), updated_at = NOW()
WHERE code = 'nrbc';

-- ============================================================================
-- Free Androgen Index: % → ratio
-- Standard unit: ratio
-- Math: 1% = 0.01 ratio
-- Factor: 0.01
-- ============================================================================
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{%}',
  '0.01'::jsonb
), updated_at = NOW()
WHERE code = 'free_androgen_index';

-- ============================================================================
-- Urine Microscopy: /µL → cells/HPF
-- Standard unit: cells/HPF (High Power Field)
-- Note: Conversion varies by microscope, ~10 /μL ≈ 1 cells/HPF
-- Factor: 0.1
-- ============================================================================

-- Epithelial Cells
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{/uL}',
  '0.1'::jsonb
), updated_at = NOW()
WHERE code = 'urine_epithelial_cells';

-- Squamous Epithelial Cells
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{/uL}',
  '0.1'::jsonb
), updated_at = NOW()
WHERE code = 'urine_squamous_epithelial';

-- Non-Squamous Epithelial Cells
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{/uL}',
  '0.1'::jsonb
), updated_at = NOW()
WHERE code = 'urine_nonsquamous_epithelial';

-- Transitional Epithelial Cells
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{/uL}',
  '0.1'::jsonb
), updated_at = NOW()
WHERE code = 'urine_transitional_epithelial';

-- Renal Tubular Epithelial Cells
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{/uL}',
  '0.1'::jsonb
), updated_at = NOW()
WHERE code = 'urine_renal_tubular_epithelial';

-- ============================================================================
-- Urine Microscopy with /μL standard: Need to ensure /uL is recognized
-- These have standard unit /μL, just need Unicode normalization which is
-- handled in code. Adding explicit /uL → /μL conversion factor of 1.
-- ============================================================================

-- Urine RBC Microscopy
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{/uL}',
  '1'::jsonb
), updated_at = NOW()
WHERE code = 'urine_rbc_microscopy';

-- Urine WBC Microscopy
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{/uL}',
  '1'::jsonb
), updated_at = NOW()
WHERE code = 'urine_wbc_microscopy';

-- Urine Casts (Total)
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{/uL}',
  '1'::jsonb
), updated_at = NOW()
WHERE code = 'urine_casts_total';

-- Hyaline Casts
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{/uL}',
  '1'::jsonb
), updated_at = NOW()
WHERE code = 'urine_casts_hyaline';

-- Pathological Casts
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{/uL}',
  '1'::jsonb
), updated_at = NOW()
WHERE code = 'urine_casts_pathological';

-- Crystals
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{/uL}',
  '1'::jsonb
), updated_at = NOW()
WHERE code = 'urine_crystals';

-- Yeast
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{/uL}',
  '1'::jsonb
), updated_at = NOW()
WHERE code = 'urine_yeast';

-- Mucus
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{/uL}',
  '1'::jsonb
), updated_at = NOW()
WHERE code = 'urine_mucus';

-- ============================================================================
-- Uric Acid: mmol/L → mg/dL
-- Standard unit: mg/dL
-- MW of uric acid = 168.11 g/mol
-- Math: 1 mmol/L = 168.11 mg/L = 16.811 mg/dL
-- Factor: 16.811
-- Note: Existing has umol/L: 0.0168, adding mmol/L
-- ============================================================================
UPDATE public.biomarker_standards
SET unit_conversions = jsonb_set(
  COALESCE(unit_conversions, '{}'::jsonb),
  '{mmol/L}',
  '16.81'::jsonb
), updated_at = NOW()
WHERE code = 'uric_acid';
