-- Migration: Add vitamin, mineral, and antioxidant biomarkers
-- Adds: Chromium, 25-OH Vitamin D2, 25-OH Vitamin D3, Gamma-Tocopherol, Lycopene, Alpha-Carotene, Beta-Carotene, Coenzyme Q10

-- Chromium (Blood/Serum)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'chromium_serum',
  'Chromium, Serum',
  ARRAY['chromium', 'Cr', 'serum chromium', 'blood chromium', 'chromium blood'],
  'mineral',
  'ng/mL',
  '{"mcg/L": 1, "nmol/L": 0.052}'::jsonb,
  '{"male": {"low": 0.1, "high": 0.4}, "female": {"low": 0.1, "high": 0.4}}'::jsonb,
  'Essential trace mineral involved in insulin signaling and glucose metabolism. Measured in serum using trace-metal collection techniques.',
  'Low levels may indicate chromium deficiency affecting glucose tolerance. Levels >1 ng/mL in patients with metal implants suggest prosthesis wear. Contamination from standard collection tubes can cause falsely elevated results.',
  2,
  250
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

-- 25-OH Vitamin D2 (Ergocalciferol)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'vitamin_d2',
  '25-Hydroxyvitamin D2',
  ARRAY['25-OH vitamin D2', 'vitamin D2', 'ergocalciferol', '25-OH-D2', 'calcidiol D2'],
  'vitamin',
  'ng/mL',
  '{"nmol/L": 0.4}'::jsonb,
  '{"male": {"low": 0, "high": 100}, "female": {"low": 0, "high": 100}}'::jsonb,
  'Plant-derived form of vitamin D measured as 25-hydroxyvitamin D2. Obtained from fortified foods and ergocalciferol supplements.',
  'Contributes to total 25-OH vitamin D levels. Deficiency (<20 ng/mL total) associated with bone disease, secondary hyperparathyroidism. Often reported with D3 as total 25-OH vitamin D. Toxicity rare but possible >150 ng/mL total.',
  1,
  251
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

-- 25-OH Vitamin D3 (Cholecalciferol)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'vitamin_d3',
  '25-Hydroxyvitamin D3',
  ARRAY['25-OH vitamin D3', 'vitamin D3', 'cholecalciferol', '25-OH-D3', 'calcidiol D3'],
  'vitamin',
  'ng/mL',
  '{"nmol/L": 0.4}'::jsonb,
  '{"male": {"low": 30, "high": 100}, "female": {"low": 30, "high": 100}}'::jsonb,
  'Primary circulating form of vitamin D produced by sun exposure or from animal sources/supplements. More potent than D2 at raising serum levels.',
  'Main indicator of vitamin D status. Deficient <20 ng/mL, insufficient 20-29 ng/mL, sufficient 30-100 ng/mL. Low levels increase risk of osteoporosis, fractures, and may affect immune function. Toxicity threshold >80 ng/mL.',
  1,
  252
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

-- Gamma-Tocopherol
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'gamma_tocopherol',
  'Gamma-Tocopherol',
  ARRAY['γ-tocopherol', 'vitamin E gamma', 'gamma tocopherol', 'g-tocopherol'],
  'vitamin',
  'mg/L',
  '{"mcg/dL": 0.1}'::jsonb,
  '{"male": {"low": 0.5, "high": 5.5}, "female": {"low": 0.5, "high": 5.5}}'::jsonb,
  'Second most abundant form of vitamin E in blood and tissues. Major dietary form of vitamin E in the US diet, with antioxidant and anti-inflammatory properties.',
  'US populations have 2-6x higher levels than Europeans due to soybean oil consumption. Has unique antioxidant properties distinct from alpha-tocopherol. May be reduced by alpha-tocopherol supplementation.',
  1,
  253
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

-- Lycopene
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'lycopene',
  'Lycopene',
  ARRAY['serum lycopene', 'plasma lycopene'],
  'nutrition',
  'mcg/dL',
  '{"umol/L": 5.37}'::jsonb,
  '{"male": {"low": 12, "high": 32}, "female": {"low": 12, "high": 32}}'::jsonb,
  'Carotenoid antioxidant responsible for the red color of tomatoes. Most prevalent carotenoid in American serum, accounting for ~50% of total plasma carotenoids.',
  'Associated with reduced risk of cardiovascular disease and certain cancers in observational studies. Primarily obtained from tomatoes and tomato products. Half-life 2-3 days. Not a routine clinical test.',
  1,
  254
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

-- Alpha-Carotene
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'alpha_carotene',
  'Alpha-Carotene',
  ARRAY['α-carotene', 'alpha carotene', 'a-carotene', 'serum alpha-carotene'],
  'nutrition',
  'mcg/dL',
  '{"umol/L": 5.37}'::jsonb,
  '{"male": {"low": 2.7, "high": 50}, "female": {"low": 2.7, "high": 50}}'::jsonb,
  'Provitamin A carotenoid with antioxidant properties. Found primarily in orange and yellow vegetables like carrots, pumpkin, and winter squash.',
  'Higher blood levels associated with 39% lower all-cause mortality in NHANES studies. Optimal levels >2.7 mcg/dL associated with reduced chronic disease risk. Not routinely tested in clinical practice.',
  1,
  255
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

-- Beta-Carotene
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'beta_carotene',
  'Beta-Carotene',
  ARRAY['β-carotene', 'beta carotene', 'b-carotene', 'carotene', 'serum carotene'],
  'vitamin',
  'mcg/dL',
  '{"umol/L": 5.37}'::jsonb,
  '{"male": {"low": 3, "high": 91}, "female": {"low": 3, "high": 91}}'::jsonb,
  'Major dietary provitamin A carotenoid converted to vitamin A in the body. Primary source of vitamin A from plant foods.',
  'Used to diagnose carotenodermia and detect fat malabsorption. Low levels may indicate vitamin A deficiency or malabsorption. Elevated levels (250-500 mcg/dL) cause yellow skin discoloration. Requires 12-hour fast before testing.',
  0,
  256
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

-- Coenzyme Q10
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'coenzyme_q10',
  'Coenzyme Q10',
  ARRAY['CoQ10', 'ubiquinone', 'ubiquinol', 'coenzyme Q', 'Q10'],
  'nutrition',
  'mcg/mL',
  '{"mg/L": 1, "umol/L": 0.863}'::jsonb,
  '{"male": {"low": 0.37, "high": 2.20}, "female": {"low": 0.37, "high": 2.20}}'::jsonb,
  'Essential cofactor in mitochondrial energy production and potent antioxidant. Present in all cells, with highest concentrations in heart, liver, and kidneys.',
  'Reduced in patients on statin therapy (dose-related). Blood levels may not reflect tissue concentrations. Useful for monitoring cardiovascular risk patients. Deficiency associated with fatigue, muscle weakness, and heart failure.',
  2,
  257
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
