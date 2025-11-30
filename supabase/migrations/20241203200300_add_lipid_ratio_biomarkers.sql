-- Migration: Add lipid ratio biomarkers
-- Adds: ApoB/ApoA1 Ratio, Cholesterol/HDL Ratio

-- ApoB/ApoA1 Ratio
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'apob_apoa1_ratio',
  'ApoB/ApoA1 Ratio',
  ARRAY['ApoB/ApoA1', 'ApoB:ApoA1', 'apolipoprotein B/A1 ratio', 'B/A1 ratio'],
  'lipid_panel',
  'ratio',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 0.9}, "female": {"low": 0, "high": 0.8}}'::jsonb,
  'Ratio of atherogenic (ApoB) to anti-atherogenic (ApoA1) lipoproteins. Indicates balance between harmful and protective cholesterol particles.',
  'Optimal <0.6, desirable <0.7. High risk >0.9 (men) or >0.8 (women). Superior to cholesterol ratios for predicting coronary risk. Elevated ratio associated with increased MACE risk.',
  2,
  279
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

-- Cholesterol/HDL Ratio (Total Cholesterol to HDL Ratio)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'cholesterol_hdl_ratio',
  'Cholesterol/HDL Ratio',
  ARRAY['TC/HDL ratio', 'total cholesterol/HDL', 'cholesterol ratio', 'TC:HDL'],
  'lipid_panel',
  'ratio',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 5.0}, "female": {"low": 0, "high": 4.0}}'::jsonb,
  'Ratio of total cholesterol to HDL cholesterol. Assesses cardiovascular risk by comparing total cholesterol burden to protective HDL.',
  'Optimal <3.5, desirable <4.0 (women) or <5.0 (men). Ratio >5 indicates high CV risk. Women with ratio >5.0 have 89% higher MI risk vs ratio <3.5. More predictive than total cholesterol alone.',
  1,
  280
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
