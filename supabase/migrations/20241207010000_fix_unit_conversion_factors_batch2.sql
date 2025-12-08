-- Migration: Fix incorrect unit conversion factors (Batch 2)
-- Formula: value_in_standard = value_in_source × factor
-- Many factors were inverted (1/factor) or off by 10x

-- ============================================================================
-- Category 1: g/L → mg/dL conversions (should be ×100, were ×0.01)
-- Math: 1 g/L = 1000 mg/L = 100 mg/dL (since 1 dL = 0.1 L)
-- ============================================================================

UPDATE public.biomarker_standards
SET unit_conversions = '{"g/L": 100}'::jsonb, updated_at = NOW()
WHERE code = 'apolipoprotein_a1';

UPDATE public.biomarker_standards
SET unit_conversions = '{"g/L": 100}'::jsonb, updated_at = NOW()
WHERE code = 'ceruloplasmin';

UPDATE public.biomarker_standards
SET unit_conversions = '{"g/L": 100}'::jsonb, updated_at = NOW()
WHERE code = 'complement_c3';

UPDATE public.biomarker_standards
SET unit_conversions = '{"g/L": 100}'::jsonb, updated_at = NOW()
WHERE code = 'complement_c4';

UPDATE public.biomarker_standards
SET unit_conversions = '{"g/L": 100}'::jsonb, updated_at = NOW()
WHERE code = 'fibrinogen';

UPDATE public.biomarker_standards
SET unit_conversions = '{"g/L": 100}'::jsonb, updated_at = NOW()
WHERE code = 'haptoglobin';

UPDATE public.biomarker_standards
SET unit_conversions = '{"g/L": 100}'::jsonb, updated_at = NOW()
WHERE code = 'prealbumin';

UPDATE public.biomarker_standards
SET unit_conversions = '{"g/L": 100}'::jsonb, updated_at = NOW()
WHERE code = 'transferrin';

-- ============================================================================
-- Category 2: Carotenoids (were off by 10×)
-- Math: 1 μmol/L × MW = MW μg/L = MW/10 μg/dL = MW/10 mcg/dL
-- ============================================================================

-- Alpha-carotene: MW = 536.87, 1 umol/L = 53.687 mcg/dL
UPDATE public.biomarker_standards
SET unit_conversions = '{"umol/L": 53.69}'::jsonb, updated_at = NOW()
WHERE code = 'alpha_carotene';

-- Beta-carotene: MW = 536.87, 1 umol/L = 53.687 mcg/dL
UPDATE public.biomarker_standards
SET unit_conversions = '{"umol/L": 53.69}'::jsonb, updated_at = NOW()
WHERE code = 'beta_carotene';

-- Beta-cryptoxanthin: MW = 552.85, 1 umol/L = 55.285 mcg/dL
UPDATE public.biomarker_standards
SET unit_conversions = '{"umol/L": 55.29}'::jsonb, updated_at = NOW()
WHERE code = 'beta_cryptoxanthin';

-- Lutein/Zeaxanthin: MW = 568.87, 1 umol/L = 56.887 mcg/dL
UPDATE public.biomarker_standards
SET unit_conversions = '{"umol/L": 56.89}'::jsonb, updated_at = NOW()
WHERE code = 'lutein_zeaxanthin';

-- Lycopene: MW = 536.87, 1 umol/L = 53.687 mcg/dL
UPDATE public.biomarker_standards
SET unit_conversions = '{"umol/L": 53.69}'::jsonb, updated_at = NOW()
WHERE code = 'lycopene';

-- ============================================================================
-- Category 3: Inverted conversions (were 1/factor instead of factor)
-- ============================================================================

-- DHEA-S: MW = 368.49, standard = mcg/dL, from umol/L
-- 1 umol/L = 368.49 μg/L = 36.849 μg/dL = 36.85 mcg/dL
UPDATE public.biomarker_standards
SET unit_conversions = '{"umol/L": 36.85}'::jsonb, updated_at = NOW()
WHERE code = 'dhea_s';

-- Testosterone, Bioavailable: MW = 288.4, standard = ng/dL, from nmol/L
-- 1 nmol/L = 288.4 ng/L = 28.84 ng/dL
UPDATE public.biomarker_standards
SET unit_conversions = '{"nmol/L": 28.84}'::jsonb, updated_at = NOW()
WHERE code = 'testosterone_bioavailable';

-- T3, Total: MW = 650.97, standard = ng/dL, from nmol/L
-- 1 nmol/L = 650.97 ng/L = 65.097 ng/dL
UPDATE public.biomarker_standards
SET unit_conversions = '{"nmol/L": 65.1}'::jsonb, updated_at = NOW()
WHERE code = 't3_total';

-- Vitamin A (Retinol): MW = 286.45, standard = mcg/dL, from umol/L
-- 1 umol/L = 286.45 μg/L = 28.645 μg/dL
UPDATE public.biomarker_standards
SET unit_conversions = '{"umol/L": 28.65}'::jsonb, updated_at = NOW()
WHERE code = 'vitamin_a';

-- Vitamin B6 (Pyridoxal Phosphate): MW = 247.14, standard = ng/mL, from nmol/L
-- 1 nmol/L = 247.14 ng/L = 0.247 ng/mL
UPDATE public.biomarker_standards
SET unit_conversions = '{"nmol/L": 0.247}'::jsonb, updated_at = NOW()
WHERE code = 'vitamin_b6';

-- Vitamin B12 (Cobalamin): MW = 1355.37, standard = pg/mL, from pmol/L
-- 1 pmol/L = 1355.37 pg/L = 1.355 pg/mL
UPDATE public.biomarker_standards
SET unit_conversions = '{"pmol/L": 1.355}'::jsonb, updated_at = NOW()
WHERE code = 'vitamin_b12';

-- ============================================================================
-- Category 4: Other errors
-- ============================================================================

-- Albumin/Creatinine Ratio: standard = mg/g, from mg/mmol
-- 1 mmol creatinine = 113.12 mg = 0.11312 g
-- 1 mg/mmol = 1 mg / 0.11312 g = 8.84 mg/g
UPDATE public.biomarker_standards
SET unit_conversions = '{"mg/mmol": 8.84}'::jsonb, updated_at = NOW()
WHERE code = 'albumin_creatinine_ratio';

-- Lactate: MW = 90.08, standard = mmol/L, from mg/dL
-- 1 mg/dL = 10 mg/L = 10/90.08 mmol/L = 0.111 mmol/L
UPDATE public.biomarker_standards
SET unit_conversions = '{"mg/dL": 0.111}'::jsonb, updated_at = NOW()
WHERE code = 'lactate';

-- Vitamin C (Ascorbic Acid): MW = 176.12, standard = mg/dL, from umol/L
-- 1 umol/L = 176.12 μg/L = 0.17612 mg/L = 0.01761 mg/dL
UPDATE public.biomarker_standards
SET unit_conversions = '{"umol/L": 0.0176}'::jsonb, updated_at = NOW()
WHERE code = 'vitamin_c';

-- IGFBP-3: standard = ng/mL, from mg/L and ug/L
-- 1 mg/L = 1000 μg/L = 1,000,000 ng/L = 1000 ng/mL
-- 1 ug/L = 1000 ng/L = 1 ng/mL
UPDATE public.biomarker_standards
SET unit_conversions = '{"mg/L": 1000, "ug/L": 1}'::jsonb, updated_at = NOW()
WHERE code = 'igfbp_3';

