-- Migration: Add urinalysis microscopy biomarkers
-- Adds 8 microscopy biomarkers for urinalysis sediment analysis
-- Standard unit: /μL (per microliter) with cells/HPF conversion

-- ============================================================================
-- URINALYSIS - MICROSCOPY/SEDIMENT ANALYSIS
-- ============================================================================

-- Urine RBC (Microscopy)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'urine_rbc_microscopy',
  'Urine RBC (Microscopy)',
  ARRAY['urine red blood cells microscopy', 'RBC microscopy', 'urine erythrocytes microscopy', 'sediment RBC'],
  'urinalysis',
  '/μL',
  '{"cells/HPF": 10}'::jsonb,
  '{"male": {"low": 0, "high": 23}, "female": {"low": 0, "high": 23}}'::jsonb,
  'Red blood cell count in urine sediment by automated microscopy. Measures intact cells in urine.',
  'Normal <23/μL. Elevated indicates hematuria (blood in urine). Causes include UTI, kidney stones, glomerulonephritis, trauma, or malignancy. Distinct from dipstick blood which detects hemoglobin.',
  1,
  307
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  aliases = EXCLUDED.aliases,
  category = EXCLUDED.category,
  standard_unit = EXCLUDED.standard_unit,
  unit_conversions = EXCLUDED.unit_conversions,
  reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description,
  clinical_significance = EXCLUDED.clinical_significance,
  decimal_places = EXCLUDED.decimal_places,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Urine WBC (Microscopy)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'urine_wbc_microscopy',
  'Urine WBC (Microscopy)',
  ARRAY['urine white blood cells microscopy', 'WBC microscopy', 'urine leukocytes microscopy', 'sediment WBC'],
  'urinalysis',
  '/μL',
  '{"cells/HPF": 10}'::jsonb,
  '{"male": {"low": 0, "high": 25}, "female": {"low": 0, "high": 25}}'::jsonb,
  'White blood cell count in urine sediment by automated microscopy. Measures intact leukocytes in urine.',
  'Normal <25/μL. Elevated indicates pyuria (pus in urine). Most commonly from UTI but also seen in interstitial nephritis, kidney stones, and STIs. Distinct from dipstick leukocyte esterase.',
  1,
  308
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  aliases = EXCLUDED.aliases,
  category = EXCLUDED.category,
  standard_unit = EXCLUDED.standard_unit,
  unit_conversions = EXCLUDED.unit_conversions,
  reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description,
  clinical_significance = EXCLUDED.clinical_significance,
  decimal_places = EXCLUDED.decimal_places,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Urine Casts (Total)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'urine_casts_total',
  'Urine Casts (Total)',
  ARRAY['urinary casts', 'total casts', 'casts urine', 'cylindruria'],
  'urinalysis',
  '/μL',
  '{"cells/HPF": 10}'::jsonb,
  '{"male": {"low": 0, "high": 1}, "female": {"low": 0, "high": 1}}'::jsonb,
  'Total urinary casts formed from protein precipitates in renal tubules. Cylindrical structures that reflect kidney pathology.',
  'Normal <1/μL. Casts indicate intrarenal pathology. Type of cast (hyaline, granular, cellular, waxy) determines clinical significance. Increased with dehydration, exercise, or kidney disease.',
  2,
  309
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  aliases = EXCLUDED.aliases,
  category = EXCLUDED.category,
  standard_unit = EXCLUDED.standard_unit,
  unit_conversions = EXCLUDED.unit_conversions,
  reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description,
  clinical_significance = EXCLUDED.clinical_significance,
  decimal_places = EXCLUDED.decimal_places,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Urine Hyaline Casts
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'urine_casts_hyaline',
  'Urine Hyaline Casts',
  ARRAY['hyaline casts', 'clear casts', 'protein casts'],
  'urinalysis',
  '/μL',
  '{"cells/HPF": 10}'::jsonb,
  '{"male": {"low": 0, "high": 1}, "female": {"low": 0, "high": 1}}'::jsonb,
  'Clear, colorless casts composed of Tamm-Horsfall protein. Most common and least specific type of cast.',
  'Normal <1/μL. Small numbers can be normal, especially after exercise or dehydration. Large numbers may indicate chronic kidney disease. Least clinically significant of cast types.',
  2,
  310
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  aliases = EXCLUDED.aliases,
  category = EXCLUDED.category,
  standard_unit = EXCLUDED.standard_unit,
  unit_conversions = EXCLUDED.unit_conversions,
  reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description,
  clinical_significance = EXCLUDED.clinical_significance,
  decimal_places = EXCLUDED.decimal_places,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Urine Pathological Casts
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'urine_casts_pathological',
  'Urine Pathological Casts',
  ARRAY['pathological casts', 'abnormal casts', 'cellular casts', 'granular casts'],
  'urinalysis',
  '/μL',
  '{"cells/HPF": 10}'::jsonb,
  '{"male": {"low": 0, "high": 0}, "female": {"low": 0, "high": 0}}'::jsonb,
  'Casts containing cells or cellular debris including RBC, WBC, epithelial, granular, waxy, and fatty casts.',
  'Should be absent. Any presence is significant. RBC casts = glomerulonephritis. WBC casts = pyelonephritis. Granular/waxy = tubular damage or chronic kidney disease. Fatty = nephrotic syndrome.',
  2,
  311
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  aliases = EXCLUDED.aliases,
  category = EXCLUDED.category,
  standard_unit = EXCLUDED.standard_unit,
  unit_conversions = EXCLUDED.unit_conversions,
  reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description,
  clinical_significance = EXCLUDED.clinical_significance,
  decimal_places = EXCLUDED.decimal_places,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Urine Crystals
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'urine_crystals',
  'Urine Crystals',
  ARRAY['crystalluria', 'urinary crystals', 'crystals urine'],
  'urinalysis',
  '/μL',
  '{"cells/HPF": 10}'::jsonb,
  '{"male": {"low": 0, "high": 10}, "female": {"low": 0, "high": 10}}'::jsonb,
  'Crystalline substances in urine sediment. Types include calcium oxalate, uric acid, triple phosphate, and cystine.',
  'Normal <10/μL. Many crystals are normal (oxalate, uric acid, phosphate) and depend on pH and concentration. Persistent crystalluria increases kidney stone risk. Cystine crystals always pathological.',
  1,
  312
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  aliases = EXCLUDED.aliases,
  category = EXCLUDED.category,
  standard_unit = EXCLUDED.standard_unit,
  unit_conversions = EXCLUDED.unit_conversions,
  reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description,
  clinical_significance = EXCLUDED.clinical_significance,
  decimal_places = EXCLUDED.decimal_places,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Urine Yeast
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'urine_yeast',
  'Urine Yeast',
  ARRAY['yeast cells urine', 'fungal cells urine', 'candida urine'],
  'urinalysis',
  '/μL',
  '{"cells/HPF": 10}'::jsonb,
  '{"male": {"low": 0, "high": 1}, "female": {"low": 0, "high": 1}}'::jsonb,
  'Yeast cells (typically Candida species) in urine sediment. May appear as budding cells or pseudohyphae.',
  'Normal <1/μL. Presence may indicate contamination, candidiasis, or immunocompromised state. More common in diabetics, catheterized patients, and those on antibiotics. May be vaginal contamination in females.',
  1,
  313
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  aliases = EXCLUDED.aliases,
  category = EXCLUDED.category,
  standard_unit = EXCLUDED.standard_unit,
  unit_conversions = EXCLUDED.unit_conversions,
  reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description,
  clinical_significance = EXCLUDED.clinical_significance,
  decimal_places = EXCLUDED.decimal_places,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Urine Mucus
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'urine_mucus',
  'Urine Mucus',
  ARRAY['mucus threads', 'mucus urine', 'mucous urine'],
  'urinalysis',
  '/μL',
  '{"cells/HPF": 10}'::jsonb,
  '{"male": {"low": 0, "high": 1}, "female": {"low": 0, "high": 1}}'::jsonb,
  'Mucus threads in urine produced by urinary tract mucous glands and epithelium.',
  'Normal <1/μL. Small amounts normal, especially in females. Increased with irritation or inflammation of urinary tract. Often seen in UTIs but non-specific. May indicate specimen contamination.',
  2,
  314
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  aliases = EXCLUDED.aliases,
  category = EXCLUDED.category,
  standard_unit = EXCLUDED.standard_unit,
  unit_conversions = EXCLUDED.unit_conversions,
  reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description,
  clinical_significance = EXCLUDED.clinical_significance,
  decimal_places = EXCLUDED.decimal_places,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();
