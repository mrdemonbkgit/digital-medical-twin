-- Migration: Add hormone-related biomarkers
-- Adds: IGFBP-3, SHBG, Free Androgen Index, % Free Testosterone, Bioavailable Testosterone, % Bioavailable Testosterone

-- IGFBP-3 (Insulin-like Growth Factor Binding Protein 3)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'igfbp_3',
  'Insulin-like Growth Factor Binding Protein 3',
  ARRAY['IGFBP-3', 'IGFBP3', 'IGF binding protein 3', 'IGF-BP3'],
  'hormone',
  'ng/mL',
  '{"ug/L": 1, "mg/L": 0.001}'::jsonb,
  '{"male": {"low": 2374, "high": 6018}, "female": {"low": 2343, "high": 5709}}'::jsonb,
  'Primary carrier protein for IGF-1 in blood. Modulates IGF-1 bioavailability and has independent growth-regulatory effects.',
  'Low levels may indicate growth hormone deficiency, malnutrition, or liver disease. High levels may occur in chronic renal failure. Highly age-dependent - decreases after puberty.',
  0,
  240
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

-- SHBG (Sex Hormone Binding Globulin)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'shbg',
  'Sex Hormone Binding Globulin',
  ARRAY['SHBG', 'sex hormone-binding globulin', 'testosterone-estrogen binding globulin', 'TeBG'],
  'hormone',
  'nmol/L',
  '{}'::jsonb,
  '{"male": {"low": 16.5, "high": 55.9}, "female": {"low": 24.6, "high": 122.0}}'::jsonb,
  'Glycoprotein that binds sex hormones (testosterone, DHT, estradiol) and regulates their bioavailability to tissues.',
  'Low SHBG associated with insulin resistance, obesity, PCOS, and type 2 diabetes. High SHBG seen in hyperthyroidism, liver disease, aging males, and estrogen use. Affects interpretation of total testosterone.',
  1,
  241
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

-- Free Androgen Index (Free Testosterone Index)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'free_androgen_index',
  'Free Androgen Index',
  ARRAY['FAI', 'free testosterone index', 'FTI', 'androgen index'],
  'hormone',
  'ratio',
  '{}'::jsonb,
  '{"male": {"low": 14.0, "high": 128.0}, "female": {"low": 0.4, "high": 8.4}}'::jsonb,
  'Calculated ratio of total testosterone to SHBG, multiplied by 100. Formula: FAI = (Total Testosterone nmol/L / SHBG nmol/L) × 100.',
  'More useful in women than men for assessing androgen status. Elevated FAI in women suggests hyperandrogenism (PCOS). Low FAI in men may indicate hypogonadism. Endocrine Society recommends against FAI for male hypogonadism assessment.',
  1,
  242
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

-- Percent Free Testosterone
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'testosterone_free_percent',
  'Free Testosterone, Percent',
  ARRAY['% free testosterone', 'percent free testosterone', 'free T %', 'free testosterone percentage'],
  'hormone',
  '%',
  '{}'::jsonb,
  '{"male": {"low": 1.5, "high": 4.2}, "female": {"low": 0.5, "high": 2.8}}'::jsonb,
  'Percentage of total testosterone that is unbound (free) and biologically active. Only 1-3% of testosterone circulates in free form.',
  'Useful when SHBG levels are abnormal, as total testosterone may not reflect true androgen status. Low percentage may indicate elevated SHBG. Measured by equilibrium dialysis or calculated from total testosterone, SHBG, and albumin.',
  1,
  243
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

-- Bioavailable Testosterone
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'testosterone_bioavailable',
  'Bioavailable Testosterone',
  ARRAY['bioavailable T', 'free and weakly bound testosterone', 'FWBT', 'non-SHBG bound testosterone'],
  'hormone',
  'ng/dL',
  '{"nmol/L": 0.0347}'::jsonb,
  '{"male": {"low": 108, "high": 500}, "female": {"low": 1.0, "high": 19.0}}'::jsonb,
  'Sum of free testosterone plus albumin-bound testosterone. Represents testosterone available for tissue uptake (excludes tightly SHBG-bound fraction).',
  'More clinically useful than total testosterone when SHBG is abnormal. Low bioavailable testosterone in men associated with hypogonadal symptoms, decreased libido, erectile dysfunction, and loss of bone density.',
  1,
  244
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

-- Percent Bioavailable Testosterone
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'testosterone_bioavailable_percent',
  'Bioavailable Testosterone, Percent',
  ARRAY['% bioavailable testosterone', 'percent bioavailable testosterone', 'bioavailable T %'],
  'hormone',
  '%',
  '{}'::jsonb,
  '{"male": {"low": 30, "high": 50}, "female": {"low": 30, "high": 35}}'::jsonb,
  'Percentage of total testosterone that is bioavailable (free + albumin-bound). Typically 30-50% of total testosterone in healthy adults.',
  'Reflects the proportion of testosterone available for biological activity. Lower percentages indicate higher SHBG binding. May be more informative than absolute values in some clinical contexts.',
  1,
  245
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
