-- Migration: Add metabolic, kidney, and CBC biomarkers
-- Adds: eAG, Creatinine (Urine), Microalbumin, ACR, ApoA1, ApoA1/B Ratio, TRAb, HOMA-IR, NRBC, CBC differentials, PDW, PCT

-- eAG (Estimated Average Glucose)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'eag',
  'Estimated Average Glucose',
  ARRAY['eAG', 'estimated glucose', 'average glucose', 'mean glucose'],
  'metabolic',
  'mg/dL',
  '{"mmol/L": 0.0555}'::jsonb,
  '{"male": {"low": 70, "high": 126}, "female": {"low": 70, "high": 126}}'::jsonb,
  'Estimated average blood glucose over 2-3 months, calculated from HbA1c. Formula: eAG = (28.7 × HbA1c) - 46.7.',
  'Provides glucose values in same units as home meters. Normal <126 mg/dL (HbA1c <6%). Diabetes target <154 mg/dL (HbA1c <7%).',
  0,
  260
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- Creatinine (Urine, Random)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'creatinine_urine',
  'Creatinine, Urine',
  ARRAY['urine creatinine', 'urinary creatinine', 'creatinine random urine'],
  'kidney',
  'mg/dL',
  '{"mmol/L": 0.0884}'::jsonb,
  '{"male": {"low": 20, "high": 320}, "female": {"low": 20, "high": 275}}'::jsonb,
  'Creatinine concentration in random urine specimen. Used to normalize other urine analytes and assess specimen validity.',
  'Varies with hydration, muscle mass, and diet. Used in albumin/creatinine ratio calculations. Very dilute or concentrated specimens may need repeat collection.',
  0,
  261
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- Microalbumin (Urine)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'microalbumin_urine',
  'Microalbumin, Urine',
  ARRAY['microalbumin', 'urine albumin', 'urinary albumin', 'MAU'],
  'kidney',
  'mg/L',
  '{"mcg/mL": 1}'::jsonb,
  '{"male": {"low": 0, "high": 20}, "female": {"low": 0, "high": 20}}'::jsonb,
  'Small amounts of albumin in urine not detected by standard dipstick. Early marker of kidney damage.',
  'Levels >20 mg/L indicate microalbuminuria. Screen annually in diabetes and hypertension. First morning sample preferred. Confirm with repeat testing.',
  1,
  262
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- Albumin/Creatinine Ratio (ACR)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'albumin_creatinine_ratio',
  'Albumin/Creatinine Ratio',
  ARRAY['ACR', 'uACR', 'microalbumin creatinine ratio', 'UACR', 'albumin:creatinine'],
  'kidney',
  'mg/g',
  '{"mg/mmol": 0.113}'::jsonb,
  '{"male": {"low": 0, "high": 17}, "female": {"low": 0, "high": 25}}'::jsonb,
  'Ratio of urine albumin to creatinine, correcting for urine concentration. Preferred screening test for kidney disease.',
  'Normal <30 mg/g (general), <17 mg/g (male), <25 mg/g (female). Microalbuminuria 30-299 mg/g. Macroalbuminuria ≥300 mg/g indicates overt nephropathy.',
  1,
  263
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- Apolipoprotein A1
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'apolipoprotein_a1',
  'Apolipoprotein A1',
  ARRAY['ApoA1', 'Apo A-1', 'ApoA-I', 'apolipoprotein A-I'],
  'lipid_panel',
  'mg/dL',
  '{"g/L": 0.01}'::jsonb,
  '{"male": {"low": 110, "high": 180}, "female": {"low": 120, "high": 215}}'::jsonb,
  'Primary protein component of HDL cholesterol. Anti-atherogenic lipoprotein that promotes reverse cholesterol transport.',
  'Low levels (<120 mg/dL) indicate increased cardiovascular risk. Better predictor of CV risk than HDL-C alone. Very low levels (<25 mg/dL) suggest Tangier disease.',
  0,
  264
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- ApoA1/ApoB Ratio
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'apoa1_apob_ratio',
  'Apolipoprotein A1/B Ratio',
  ARRAY['ApoA1/ApoB', 'ApoA1:ApoB ratio', 'A1/B ratio'],
  'lipid_panel',
  'ratio',
  '{}'::jsonb,
  '{"male": {"low": 1.11, "high": 2.5}, "female": {"low": 1.11, "high": 2.5}}'::jsonb,
  'Ratio of anti-atherogenic (ApoA1) to atherogenic (ApoB) lipoproteins. Inverse of commonly reported ApoB/ApoA1 ratio.',
  'Higher ratio indicates better cardiovascular protection. Ratio <1.11 (ApoB/ApoA1 >0.9) indicates high CV risk. Optimal >1.67 (ApoB/ApoA1 <0.6).',
  2,
  265
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- TRAb (TSH Receptor Antibody)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'trab',
  'TSH Receptor Antibody',
  ARRAY['TRAb', 'TSHR antibody', 'thyrotropin receptor antibody', 'TSI', 'thyroid stimulating immunoglobulin'],
  'thyroid',
  'IU/L',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 1.75}, "female": {"low": 0, "high": 1.75}}'::jsonb,
  'Antibodies against TSH receptor. Includes stimulating (TSI) and blocking antibodies. Key marker for Graves disease.',
  'Negative <1.75 IU/L. Positive results indicate autoimmune thyroid disease. High levels (>5.25 IU/L) strongly suggest Graves disease. Monitor in pregnancy for neonatal thyrotoxicosis risk.',
  2,
  266
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- HOMA-IR
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'homa_ir',
  'HOMA-IR',
  ARRAY['HOMA IR', 'homeostatic model assessment', 'insulin resistance index', 'HOMA'],
  'metabolic',
  'index',
  '{}'::jsonb,
  '{"male": {"low": 0.5, "high": 1.4}, "female": {"low": 0.5, "high": 1.4}}'::jsonb,
  'Calculated index of insulin resistance. Formula: (Fasting Insulin μU/mL × Fasting Glucose mg/dL) / 405.',
  '<1.0 optimal (insulin sensitive). >1.9 early insulin resistance. >2.9 significant insulin resistance. Associated with metabolic syndrome, PCOS, NAFLD, prediabetes.',
  2,
  267
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- NRBC (Absolute)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'nrbc',
  'Nucleated Red Blood Cells',
  ARRAY['NRBC', 'nucleated RBC', 'nRBC absolute', 'erythroblasts'],
  'hematology',
  'cells/μL',
  '{"/100 WBC": 0.01}'::jsonb,
  '{"male": {"low": 0, "high": 100}, "female": {"low": 0, "high": 100}}'::jsonb,
  'Immature red blood cells with nuclei. Normally absent in adult peripheral blood except in neonates.',
  'Presence in adults is pathological. Associated with severe anemia, hemolysis, hypoxia, bone marrow disorders, sepsis. Elevated levels correlate with increased mortality in critically ill patients.',
  0,
  268
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- NRBC %
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'nrbc_percent',
  'Nucleated Red Blood Cells, Percent',
  ARRAY['NRBC %', 'nRBC percent', 'NRBC/100 WBC'],
  'hematology',
  '%',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 0.5}, "female": {"low": 0, "high": 0.5}}'::jsonb,
  'Percentage of nucleated red blood cells per 100 white blood cells counted.',
  'Normal is 0%. Values >1.5% usually clinically significant. Must correct WBC count when NRBCs present as they are counted as WBCs by analyzers.',
  1,
  269
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- Neutrophils %
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'neutrophils_percent',
  'Neutrophils, Percent',
  ARRAY['neutrophils %', 'neut %', 'segs %', 'PMN %', 'polymorphonuclear %'],
  'cbc',
  '%',
  '{}'::jsonb,
  '{"male": {"low": 40, "high": 70}, "female": {"low": 40, "high": 70}}'::jsonb,
  'Percentage of neutrophils in white blood cell differential. Most abundant WBC type, primary defense against bacterial infections.',
  'Elevated (neutrophilia) in bacterial infection, inflammation, stress. Decreased (neutropenia) in viral infections, bone marrow suppression, autoimmune conditions.',
  1,
  270
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- Lymphocytes %
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'lymphocytes_percent',
  'Lymphocytes, Percent',
  ARRAY['lymphocytes %', 'lymphs %', 'lymph %'],
  'cbc',
  '%',
  '{}'::jsonb,
  '{"male": {"low": 20, "high": 40}, "female": {"low": 20, "high": 40}}'::jsonb,
  'Percentage of lymphocytes in white blood cell differential. Key cells of adaptive immunity (T cells, B cells, NK cells).',
  'Elevated (lymphocytosis) in viral infections, chronic lymphocytic leukemia. Decreased (lymphopenia) in HIV, immunosuppression, acute stress.',
  1,
  271
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- Eosinophils %
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'eosinophils_percent',
  'Eosinophils, Percent',
  ARRAY['eosinophils %', 'eos %', 'eosino %'],
  'cbc',
  '%',
  '{}'::jsonb,
  '{"male": {"low": 1, "high": 4}, "female": {"low": 1, "high": 4}}'::jsonb,
  'Percentage of eosinophils in white blood cell differential. Involved in allergic responses and parasitic infections.',
  'Elevated (eosinophilia) in allergies, asthma, parasitic infections, drug reactions, eosinophilic disorders. Decreased in acute stress, Cushing syndrome.',
  1,
  272
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- Monocytes %
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'monocytes_percent',
  'Monocytes, Percent',
  ARRAY['monocytes %', 'mono %', 'monos %'],
  'cbc',
  '%',
  '{}'::jsonb,
  '{"male": {"low": 2, "high": 8}, "female": {"low": 2, "high": 8}}'::jsonb,
  'Percentage of monocytes in white blood cell differential. Precursors to tissue macrophages, involved in phagocytosis and antigen presentation.',
  'Elevated (monocytosis) in chronic infections, inflammatory conditions, malignancies. Part of innate immune response.',
  1,
  273
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- Basophils %
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'basophils_percent',
  'Basophils, Percent',
  ARRAY['basophils %', 'baso %', 'basos %'],
  'cbc',
  '%',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 1}, "female": {"low": 0, "high": 1}}'::jsonb,
  'Percentage of basophils in white blood cell differential. Least common WBC, involved in allergic and inflammatory responses.',
  'Elevated (basophilia) rare but seen in myeloproliferative disorders, allergic conditions, chronic inflammation. Contains histamine and heparin.',
  1,
  274
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- Immature Granulocytes (Absolute)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'immature_granulocytes',
  'Immature Granulocytes',
  ARRAY['IG', 'IG#', 'immature grans', 'bands and earlier'],
  'cbc',
  'cells/μL',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 30}, "female": {"low": 0, "high": 30}}'::jsonb,
  'Absolute count of immature granulocytes (metamyelocytes, myelocytes, promyelocytes). Does not include bands.',
  'Normally absent or very low in peripheral blood. Elevated indicates left shift - early response to infection, inflammation, or bone marrow stimulation.',
  0,
  275
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- Immature Granulocytes %
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'immature_granulocytes_percent',
  'Immature Granulocytes, Percent',
  ARRAY['IG %', 'IG%', 'immature grans %'],
  'cbc',
  '%',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 0.6}, "female": {"low": 0, "high": 0.6}}'::jsonb,
  'Percentage of immature granulocytes in white blood cell differential.',
  'Normal 0-0.6%. >1% indicates left shift. >2% in isolation may indicate acute infection even without elevated neutrophils. Early marker of sepsis.',
  2,
  276
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- Platelet Distribution Width (PDW)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'pdw',
  'Platelet Distribution Width',
  ARRAY['PDW', 'platelet anisocytosis'],
  'cbc',
  'fL',
  '{"%" : 1}'::jsonb,
  '{"male": {"low": 9.0, "high": 17.0}, "female": {"low": 9.0, "high": 17.0}}'::jsonb,
  'Measure of variation in platelet size. Analogous to RDW for red blood cells.',
  'Elevated PDW indicates platelet anisocytosis. Associated with platelet activation, inflammatory conditions, thrombotic events. >17 fL associated with increased mortality in acute coronary syndrome.',
  1,
  277
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();

-- Plateletcrit (PCT)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'plateletcrit',
  'Plateletcrit',
  ARRAY['PCT', 'platelet crit', 'platelet volume fraction'],
  'cbc',
  '%',
  '{}'::jsonb,
  '{"male": {"low": 0.20, "high": 0.36}, "female": {"low": 0.20, "high": 0.36}}'::jsonb,
  'Volume of blood occupied by platelets as percentage. Calculated as PCT = (Platelet count × MPV) / 10,000.',
  'Analogous to hematocrit for red blood cells. Low PCT in thrombocytopenia. High PCT in thrombocytosis, reactive conditions. Varies with platelet count and MPV.',
  2,
  278
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, aliases = EXCLUDED.aliases, reference_ranges = EXCLUDED.reference_ranges,
  description = EXCLUDED.description, clinical_significance = EXCLUDED.clinical_significance, updated_at = NOW();
