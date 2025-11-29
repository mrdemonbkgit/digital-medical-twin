-- Remove duplicate anti_tpo entry and merge aliases into thyroid_peroxidase_ab
-- Both entries refer to Thyroid Peroxidase Antibodies (TPO Ab) test

-- First, update the primary entry with additional aliases
UPDATE public.biomarker_standards
SET
  aliases = ARRAY['TPO Ab', 'anti-TPO', 'TPO antibodies', 'TPOAb', 'Anti-TPO Antibodies'],
  description = 'Antibodies against thyroid peroxidase enzyme',
  clinical_significance = 'Elevated in Hashimoto thyroiditis and Graves disease.'
WHERE code = 'thyroid_peroxidase_ab';

-- Delete the duplicate entry
DELETE FROM public.biomarker_standards
WHERE code = 'anti_tpo';

-- Update display_order for anti_thyroglobulin (was 238, now 237)
UPDATE public.biomarker_standards
SET display_order = 237
WHERE code = 'anti_thyroglobulin';
