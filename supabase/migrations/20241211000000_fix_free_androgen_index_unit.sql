-- Fix Free Androgen Index unit conversion
-- FAI is calculated as (Total T / SHBG) × 100, so % and ratio are equivalent (1:1)

UPDATE public.biomarker_standards
SET unit_conversions = '{"%" : 1}'::jsonb
WHERE code = 'free_androgen_index';
