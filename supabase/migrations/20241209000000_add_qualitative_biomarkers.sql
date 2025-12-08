-- Migration: Add qualitative biomarkers for PDW (GSD) and HBsAg (S/CO)
-- These represent different measurement types that cannot be converted to quantitative units

-- ============================================================================
-- CBC / HEMATOLOGY - PDW with GSD unit
-- ============================================================================

-- PDW measured as Gaussian Standard Deviation (statistical metric from some analyzers)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'pdw_gsd',
  'Platelet Distribution Width (GSD)',
  ARRAY['PDW GSD', 'platelet distribution width gaussian', 'PDW 10GSD'],
  'cbc',
  'GSD',
  '{}'::jsonb,
  '{"male": {"low": 9.0, "high": 17.0}, "female": {"low": 9.0, "high": 17.0}}'::jsonb,
  'Platelet distribution width measured as Gaussian Standard Deviation. Statistical metric from some older hematology analyzers representing platelet size distribution.',
  'Indicates platelet size variation. Higher values may suggest platelet production disorders, myeloproliferative conditions, or reactive thrombocytosis. Lower values indicate uniform platelet size.',
  1,
  315
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

-- ============================================================================
-- INFECTIOUS DISEASE - HBsAg Qualitative with S/CO unit
-- ============================================================================

-- HBsAg Qualitative (Signal-to-Cutoff ratio)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'hbsag_qualitative',
  'Hepatitis B Surface Antigen (Qualitative)',
  ARRAY['HBsAg S/CO', 'HBsAg COI', 'HBsAg qualitative', 'HBsAg screening', 'HBsAg cutoff index'],
  'infectious_disease',
  'S/CO',
  '{"COI": 1}'::jsonb,
  '{"male": {"low": 0, "high": 1.0}, "female": {"low": 0, "high": 1.0}}'::jsonb,
  'Qualitative screening test for Hepatitis B surface antigen using signal-to-cutoff ratio. S/CO < 1.0 = non-reactive (negative), S/CO >= 1.0 = reactive (positive). Values 1.0-5.0 may be indeterminate.',
  'Positive (S/CO >= 1.0) indicates active HBV infection or chronic carrier state. Reactive results should be confirmed with quantitative HBsAg testing (IU/mL) and HBV DNA viral load.',
  2,
  316
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
