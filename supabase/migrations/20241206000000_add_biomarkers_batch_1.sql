-- Migration: Add new biomarkers (batch 1)
-- Adds: 28 biomarkers across lipid, CBC, infectious disease, nutrition, stool, urinalysis, body composition, coagulation, tumor markers, liver, autoimmune, and iron categories

-- ============================================================================
-- LIPID PANEL
-- ============================================================================

-- LDL-C/HDL-C Ratio
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'ldl_hdl_ratio',
  'LDL-C/HDL-C Ratio',
  ARRAY['LDL/HDL ratio', 'LDL to HDL ratio', 'LDL:HDL', 'bad to good cholesterol ratio'],
  'lipid_panel',
  'ratio',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 3.5}, "female": {"low": 0, "high": 3.0}}'::jsonb,
  'Ratio of LDL cholesterol (bad) to HDL cholesterol (good). Indicates cardiovascular risk by comparing atherogenic to protective lipoproteins.',
  'Optimal <2.0, desirable <2.5. Ratio >3.5 (men) or >3.0 (women) indicates elevated cardiovascular risk. More predictive than individual cholesterol values alone.',
  2,
  281
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
-- CBC / HEMATOLOGY
-- ============================================================================

-- Band Neutrophils
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'band_neutrophils',
  'Band Neutrophils',
  ARRAY['bands', 'band forms', 'immature neutrophils', 'stab cells', 'band cells'],
  'cbc',
  '%',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 3}, "female": {"low": 0, "high": 3}}'::jsonb,
  'Immature neutrophils released from bone marrow. Normally present in small numbers but increase during acute infections.',
  'Elevated band count (>6%) called "left shift" indicates acute bacterial infection, inflammation, or bone marrow stress. Bandemia >10% suggests severe infection or sepsis.',
  0,
  282
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

-- Atypical Lymphocytes
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'atypical_lymphocytes',
  'Atypical Lymphocytes',
  ARRAY['reactive lymphocytes', 'variant lymphocytes', 'Downey cells', 'activated lymphocytes'],
  'cbc',
  '%',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 3}, "female": {"low": 0, "high": 3}}'::jsonb,
  'Activated lymphocytes with altered morphology, typically larger with more cytoplasm. Represent immune system response to infection.',
  'Elevated >10% strongly suggests viral infection, especially EBV (infectious mononucleosis) or CMV. Also seen in hepatitis, toxoplasmosis, and drug reactions.',
  0,
  283
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
-- INFECTIOUS DISEASE (NEW CATEGORY)
-- ============================================================================

-- Hepatitis B Surface Antibody (HBsAb)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'hbsab',
  'Hepatitis B Surface Antibody',
  ARRAY['HBsAb', 'anti-HBs', 'HBs antibody', 'hepatitis B antibody'],
  'infectious_disease',
  'mIU/mL',
  '{}'::jsonb,
  '{"male": {"low": 10, "high": 99999}, "female": {"low": 10, "high": 99999}}'::jsonb,
  'Antibody against hepatitis B surface antigen. Indicates immunity to hepatitis B from vaccination or recovered infection.',
  '>10 mIU/mL = positive (immune). <10 mIU/mL = negative (not immune). Levels may wane over time but anamnestic response usually provides protection. Booster recommended if <10 mIU/mL in high-risk individuals.',
  1,
  284
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

-- Hepatitis B Surface Antigen (HBsAg)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'hbsag',
  'Hepatitis B Surface Antigen',
  ARRAY['HBsAg', 'hepatitis B antigen', 'Australia antigen', 'HBs antigen'],
  'infectious_disease',
  'IU/mL',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 0.05}, "female": {"low": 0, "high": 0.05}}'::jsonb,
  'Viral surface protein indicating active hepatitis B infection. First marker to appear in acute infection.',
  '<0.05 IU/mL = negative. Positive result indicates active HBV infection (acute or chronic). Persistence >6 months defines chronic infection. Used for screening blood donors and pregnant women.',
  2,
  285
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

-- Anti-HCV Antibody
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'anti_hcv',
  'Anti-HCV Antibody',
  ARRAY['HCV antibody', 'hepatitis C antibody', 'anti-hepatitis C', 'HCV Ab'],
  'infectious_disease',
  'S/CO',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 0.9}, "female": {"low": 0, "high": 0.9}}'::jsonb,
  'Antibody against hepatitis C virus. Indicates current or past HCV infection. Reported as signal-to-cutoff ratio.',
  'S/CO <1.0 = non-reactive (negative). S/CO >=1.0 = reactive (positive), requires confirmatory testing. Does not distinguish current from resolved infection. HCV RNA test needed to confirm active infection.',
  2,
  286
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
-- NUTRITION
-- ============================================================================

-- Lutein and Zeaxanthin
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'lutein_zeaxanthin',
  'Lutein and Zeaxanthin',
  ARRAY['macular pigment', 'xanthophylls', 'lutein', 'zeaxanthin', 'macular carotenoids'],
  'nutrition',
  'mcg/dL',
  '{"umol/L": 5.68}'::jsonb,
  '{"male": {"low": 10, "high": 70}, "female": {"low": 10, "high": 70}}'::jsonb,
  'Carotenoids that accumulate in the macula of the eye. Primary components of macular pigment providing protection against blue light and oxidative damage.',
  'Higher levels associated with reduced risk of age-related macular degeneration (AMD). Found in dark leafy greens and egg yolks. Not routinely tested clinically.',
  1,
  287
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

-- Beta-Cryptoxanthin
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'beta_cryptoxanthin',
  'Beta-Cryptoxanthin',
  ARRAY['cryptoxanthin', 'beta cryptoxanthin', 'b-cryptoxanthin'],
  'nutrition',
  'mcg/dL',
  '{"umol/L": 5.46}'::jsonb,
  '{"male": {"low": 2, "high": 30}, "female": {"low": 2, "high": 30}}'::jsonb,
  'Provitamin A carotenoid found in orange and red fruits. Can be converted to vitamin A in the body.',
  'Associated with reduced inflammation and lower risk of rheumatoid arthritis in some studies. Found in oranges, papaya, tangerines, and red peppers. Not routinely tested.',
  1,
  288
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
-- STOOL ANALYSIS (NEW CATEGORY)
-- ============================================================================

-- Stool RBC
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'stool_rbc',
  'Stool RBC',
  ARRAY['fecal RBC', 'stool red blood cells', 'fecal red blood cells', 'stool erythrocytes'],
  'stool_analysis',
  'cells/HPF',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 2}, "female": {"low": 0, "high": 2}}'::jsonb,
  'Red blood cells in stool detected by microscopy. Indicates bleeding in the gastrointestinal tract.',
  'Any RBCs suggest GI bleeding. Source may be upper GI (dark/degraded) or lower GI (fresh/bright). Further workup with colonoscopy/endoscopy often indicated. May be false positive with red foods.',
  0,
  289
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

-- Stool WBC
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'stool_wbc',
  'Stool WBC',
  ARRAY['fecal WBC', 'stool white blood cells', 'fecal leukocytes', 'stool leukocytes'],
  'stool_analysis',
  'cells/HPF',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 3}, "female": {"low": 0, "high": 3}}'::jsonb,
  'White blood cells in stool indicating intestinal inflammation or infection.',
  'Presence suggests inflammatory or invasive infectious diarrhea (Shigella, Salmonella, C. diff, IBD). Absent in viral gastroenteritis and toxin-mediated diarrhea. Helps guide need for stool culture.',
  0,
  290
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
-- URINALYSIS - EPITHELIAL CELLS
-- ============================================================================

-- Urine Epithelial Cells (Total)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'urine_epithelial_cells',
  'Urine Epithelial Cells',
  ARRAY['epithelial cells urine', 'urine epithelial', 'urinary epithelial cells'],
  'urinalysis',
  'cells/HPF',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 15}, "female": {"low": 0, "high": 15}}'::jsonb,
  'Total epithelial cells in urine from urinary tract lining. Includes squamous, transitional, and renal tubular types.',
  'Few epithelial cells are normal. High counts may indicate contamination (squamous), bladder inflammation (transitional), or kidney damage (renal tubular). Type of cells determines clinical significance.',
  0,
  291
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

-- Urine Squamous Epithelial Cells
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'urine_squamous_epithelial',
  'Urine Squamous Epithelial Cells',
  ARRAY['squamous epithelial cells', 'squamous cells urine', 'SEC'],
  'urinalysis',
  'cells/HPF',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 15}, "female": {"low": 0, "high": 15}}'::jsonb,
  'Flat cells from skin, vagina, or distal urethra. Most common epithelial cells seen in urine.',
  'Large numbers (>15-20/HPF) indicate specimen contamination, especially in females. May require recollection with clean-catch technique. Do not originate from urinary tract proper.',
  0,
  292
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

-- Non-Squamous Epithelial Cells
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'urine_nonsquamous_epithelial',
  'Non-Squamous Epithelial Cells',
  ARRAY['non-squamous epithelial', 'NSEC', 'round epithelial cells'],
  'urinalysis',
  'cells/HPF',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 2}, "female": {"low": 0, "high": 2}}'::jsonb,
  'Includes transitional and renal tubular epithelial cells. Originate from actual urinary tract tissue.',
  'Elevated counts are clinically significant unlike squamous cells. May indicate bladder or kidney pathology. Further characterization as transitional vs renal tubular helps localize the source.',
  0,
  293
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

-- Transitional Epithelial Cells
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'urine_transitional_epithelial',
  'Transitional Epithelial Cells',
  ARRAY['urothelial cells', 'transitional cells', 'bladder epithelial cells'],
  'urinalysis',
  'cells/HPF',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 2}, "female": {"low": 0, "high": 2}}'::jsonb,
  'Cells lining the renal pelvis, ureters, bladder, and proximal urethra. Also called urothelial cells.',
  'Small numbers normal. Increased with catheterization, UTI, bladder stones, or transitional cell carcinoma. Atypical transitional cells warrant cytology and possible cystoscopy.',
  0,
  294
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

-- Renal Tubular Epithelial Cells
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'urine_renal_tubular_epithelial',
  'Renal Tubular Epithelial Cells',
  ARRAY['RTE cells', 'renal epithelial cells', 'tubular cells', 'kidney epithelial cells'],
  'urinalysis',
  'cells/HPF',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 1}, "female": {"low": 0, "high": 1}}'::jsonb,
  'Cells from kidney tubules. Most significant type of epithelial cells found in urine.',
  'Any significant number indicates kidney tubular damage. Seen in acute tubular necrosis (ATN), nephrotoxic drug injury, acute rejection in transplant kidneys, and viral nephropathy. Often with granular casts.',
  0,
  295
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
-- BODY COMPOSITION (NEW CATEGORY)
-- ============================================================================

-- Weight
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'weight',
  'Weight',
  ARRAY['body weight', 'mass', 'BW'],
  'body_composition',
  'kg',
  '{"lb": 0.4536, "lbs": 0.4536}'::jsonb,
  '{"male": {"low": 60, "high": 90}, "female": {"low": 50, "high": 75}}'::jsonb,
  'Total body mass including fat, muscle, bone, and water. Basic anthropometric measurement.',
  'Reference ranges are population averages; optimal weight depends on height (BMI), body composition, and individual factors. Significant changes may indicate disease, fluid status, or nutritional issues.',
  1,
  296
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

-- Body Fat Percentage
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'body_fat_percentage',
  'Body Fat Percentage',
  ARRAY['BF%', 'body fat %', 'percent body fat', 'fat percentage'],
  'body_composition',
  '%',
  '{}'::jsonb,
  '{"male": {"low": 10, "high": 20}, "female": {"low": 18, "high": 28}}'::jsonb,
  'Percentage of total body weight composed of fat tissue. Includes essential fat and storage fat.',
  'Essential fat: ~3% men, ~12% women. Athletes: 6-13% men, 14-20% women. Fitness: 14-17% men, 21-24% women. Obesity: >25% men, >32% women. Measured by DEXA, BIA, calipers, or hydrostatic weighing.',
  1,
  297
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

-- Fat Mass
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'fat_mass',
  'Fat Mass',
  ARRAY['FM', 'adipose mass', 'body fat mass', 'total fat'],
  'body_composition',
  'kg',
  '{"lb": 0.4536, "lbs": 0.4536}'::jsonb,
  '{"male": {"low": 8, "high": 20}, "female": {"low": 10, "high": 25}}'::jsonb,
  'Absolute weight of fat tissue in the body. Calculated from body fat percentage and total weight.',
  'More meaningful than weight alone for assessing body composition changes. Track changes over time rather than absolute values. Essential fat reserves needed for hormonal function and organ protection.',
  1,
  298
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

-- Muscle Mass
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'muscle_mass',
  'Muscle Mass',
  ARRAY['skeletal muscle mass', 'SMM', 'lean muscle mass', 'muscle weight'],
  'body_composition',
  'kg',
  '{"lb": 0.4536, "lbs": 0.4536}'::jsonb,
  '{"male": {"low": 30, "high": 50}, "female": {"low": 20, "high": 35}}'::jsonb,
  'Weight of skeletal muscle tissue. Key component of lean body mass and metabolic health.',
  'Higher muscle mass associated with better metabolic health, insulin sensitivity, and functional capacity. Sarcopenia (low muscle mass) increases fall risk and mortality in elderly. Track trends over time.',
  1,
  299
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
-- COAGULATION
-- ============================================================================

-- Prothrombin Time % (PT%)
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'pt_percent',
  'Prothrombin Time %',
  ARRAY['PT%', 'prothrombin activity', 'PT percentage', 'Quick value'],
  'coagulation',
  '%',
  '{}'::jsonb,
  '{"male": {"low": 70, "high": 130}, "female": {"low": 70, "high": 130}}'::jsonb,
  'Prothrombin time expressed as percentage of normal control. Alternative to PT in seconds.',
  '70-130% = normal. <70% indicates prolonged clotting (bleeding risk). Used in some countries instead of PT seconds. Inversely related to PT seconds - lower % = longer clotting time.',
  0,
  300
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

-- Control Prothrombin Time
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'pt_control',
  'Control Prothrombin Time',
  ARRAY['PT control', 'control PT', 'reference PT', 'normal PT'],
  'coagulation',
  'seconds',
  '{}'::jsonb,
  '{"male": {"low": 11, "high": 13}, "female": {"low": 11, "high": 13}}'::jsonb,
  'Reference prothrombin time value from pooled normal plasma. Used to calculate PT ratio and INR.',
  'Varies by laboratory and reagent. Used as denominator in INR calculation: INR = (Patient PT / Control PT)^ISI. Reported alongside patient PT for proper interpretation.',
  1,
  301
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
-- TUMOR MARKERS
-- ============================================================================

-- Cyfra 21-1
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'cyfra_21_1',
  'Cyfra 21-1',
  ARRAY['cytokeratin 19 fragment', 'CK19 fragment', 'CYFRA21-1', 'cytokeratin fragment 21-1'],
  'tumor_marker',
  'ng/mL',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 3.3}, "female": {"low": 0, "high": 3.3}}'::jsonb,
  'Fragment of cytokeratin 19, a structural protein of epithelial cells. Tumor marker primarily for non-small cell lung cancer (NSCLC).',
  '>3.3 ng/mL elevated. Used for NSCLC monitoring and prognosis. Also elevated in bladder and other epithelial cancers. May be elevated in benign conditions (renal failure, liver cirrhosis). Not for screening.',
  1,
  302
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

-- SCC Antigen
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'scc_antigen',
  'SCC Antigen',
  ARRAY['squamous cell carcinoma antigen', 'SCCA', 'SCC-Ag', 'squamous cell carcinoma marker'],
  'tumor_marker',
  'ng/mL',
  '{}'::jsonb,
  '{"male": {"low": 0, "high": 1.5}, "female": {"low": 0, "high": 1.5}}'::jsonb,
  'Tumor-associated antigen from squamous cell carcinomas. Subunit of serine protease inhibitor.',
  '>1.5 ng/mL elevated. Used for cervical, head/neck, lung, and esophageal squamous cell carcinoma monitoring. Correlates with tumor stage and recurrence. Also elevated in psoriasis, eczema, and renal failure.',
  1,
  303
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
-- LIVER
-- ============================================================================

-- Indirect Bilirubin
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'bilirubin_indirect',
  'Indirect Bilirubin',
  ARRAY['unconjugated bilirubin', 'indirect bili', 'I. Bili', 'free bilirubin'],
  'liver',
  'mg/dL',
  '{"umol/L": 0.0585}'::jsonb,
  '{"male": {"low": 0.2, "high": 0.8}, "female": {"low": 0.2, "high": 0.8}}'::jsonb,
  'Unconjugated bilirubin not yet processed by the liver. Calculated as Total Bilirubin minus Direct Bilirubin.',
  'Elevated in hemolysis, Gilbert syndrome, and conditions causing increased bilirubin production. Not water-soluble so cannot be excreted in urine. High levels can cross blood-brain barrier (kernicterus in newborns).',
  1,
  304
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
-- AUTOIMMUNE / IMMUNOLOGY
-- ============================================================================

-- Total IgE
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'ige_total',
  'Total IgE',
  ARRAY['immunoglobulin E', 'IgE', 'serum IgE', 'total immunoglobulin E'],
  'autoimmune',
  'IU/mL',
  '{"kU/L": 1}'::jsonb,
  '{"male": {"low": 0, "high": 100}, "female": {"low": 0, "high": 100}}'::jsonb,
  'Total immunoglobulin E antibody level. IgE mediates allergic reactions and parasitic immunity.',
  'Elevated in allergic conditions (asthma, allergic rhinitis, atopic dermatitis), parasitic infections, and some immunodeficiencies. Very high levels (>2000 IU/mL) seen in allergic bronchopulmonary aspergillosis.',
  0,
  305
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
-- IRON STUDIES
-- ============================================================================

-- Transferrin
INSERT INTO public.biomarker_standards (code, name, aliases, category, standard_unit, unit_conversions, reference_ranges, description, clinical_significance, decimal_places, display_order)
VALUES (
  'transferrin',
  'Transferrin',
  ARRAY['serum transferrin', 'siderophilin', 'Tf'],
  'iron',
  'mg/dL',
  '{"g/L": 0.01}'::jsonb,
  '{"male": {"low": 200, "high": 360}, "female": {"low": 200, "high": 360}}'::jsonb,
  'Iron transport protein synthesized in the liver. Carries iron from absorption sites and storage to tissues.',
  'Low in iron overload, inflammation, malnutrition, liver disease. Elevated in iron deficiency (body attempts to increase iron absorption). Used with iron and TIBC to assess iron status. Negative acute phase reactant.',
  0,
  306
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
