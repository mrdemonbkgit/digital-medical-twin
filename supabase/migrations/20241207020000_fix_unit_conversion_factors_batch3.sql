-- Migration: Fix missing unit conversion factors (Batch 3)
-- Formula: value_in_standard = value_in_source × factor

-- ============================================================================
-- IGFBP-3: ug/mL → ng/mL
-- Standard unit: ng/mL
-- Missing conversion: ug/mL (lab reported micrograms per milliliter)
-- Math: 1 ug = 1000 ng, so 1 ug/mL = 1000 ng/mL
-- ============================================================================
UPDATE public.biomarker_standards
SET unit_conversions = '{"mg/L": 1000, "ug/L": 1, "ug/mL": 1000}'::jsonb, updated_at = NOW()
WHERE code = 'igfbp_3';

-- ============================================================================
-- Copper: ug/L → mcg/dL
-- Standard unit: mcg/dL
-- Missing conversion: ug/L (ug = mcg, just different prefix notation)
-- Math: 1 L = 10 dL, so 1 ug/L = 0.1 ug/dL = 0.1 mcg/dL
-- ============================================================================
UPDATE public.biomarker_standards
SET unit_conversions = '{"umol/L": 6.355, "ug/L": 0.1}'::jsonb, updated_at = NOW()
WHERE code = 'copper';

-- ============================================================================
-- Gamma-Tocopherol: umol/L → mg/L AND fix mcg/dL conversion
-- Standard unit: mg/L
--
-- umol/L conversion (NEW):
--   Molecular weight: 416.68 g/mol
--   Math: 1 umol/L = 416.68 μg/L = 0.41668 mg/L
--   Factor: 0.417
--
-- mcg/dL conversion (FIX - was 0.1, should be 0.01):
--   Math: 1 mcg = 0.001 mg, 1 dL = 0.1 L
--   1 mcg/dL = 10 mcg/L = 0.01 mg/L
--   Factor: 0.01 (was incorrectly 0.1)
-- ============================================================================
UPDATE public.biomarker_standards
SET unit_conversions = '{"mcg/dL": 0.01, "umol/L": 0.417}'::jsonb, updated_at = NOW()
WHERE code = 'gamma_tocopherol';

-- ============================================================================
-- D-Dimer: mg/L FEU → ng/mL (FIX - was 0.001, should be 1000)
-- Standard unit: ng/mL
-- Math: 1 mg = 1,000,000 ng, 1 L = 1000 mL
--       1 mg/L = 1,000,000 ng / 1000 mL = 1000 ng/mL
-- Factor: 1000 (was incorrectly 0.001 - inverted!)
-- ============================================================================
UPDATE public.biomarker_standards
SET unit_conversions = '{"ug/L": 1, "mg/L FEU": 1000}'::jsonb, updated_at = NOW()
WHERE code = 'd_dimer';

-- ============================================================================
-- Ammonia: ug/dL → umol/L (FIX - was 1.7, should be 0.587)
-- Standard unit: umol/L
-- MW of NH3 = 17.03 g/mol
-- Math: 1 ug/dL = 10 ug/L = 10 μg/L
--       = 10 / 17.03 umol/L = 0.587 umol/L
-- Factor: 0.587 (was incorrectly 1.7 - inverted!)
-- ============================================================================
UPDATE public.biomarker_standards
SET unit_conversions = '{"ug/dL": 0.587}'::jsonb, updated_at = NOW()
WHERE code = 'ammonia';
