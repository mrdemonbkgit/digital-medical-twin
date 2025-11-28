-- Create biomarker_standards table for standardized biomarker definitions
-- This stores the canonical list of biomarkers with their standard units, reference ranges, etc.

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.biomarker_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  code TEXT NOT NULL UNIQUE, -- e.g., 'glucose', 'hba1c', 'cholesterol_total'
  name TEXT NOT NULL, -- Display name, e.g., 'Blood Glucose'

  -- Aliases for matching during extraction
  aliases TEXT[] DEFAULT '{}', -- Common variations, e.g., ['fasting glucose', 'blood sugar', 'FBG']

  -- Categorization
  category TEXT NOT NULL, -- e.g., 'metabolic', 'lipid_panel', 'cbc', 'liver', 'kidney', 'thyroid', 'vitamin', 'hormone'

  -- Standard unit (US conventional)
  standard_unit TEXT NOT NULL, -- e.g., 'mg/dL', 'IU/L', 'mcg/dL'

  -- Unit conversions (from various units to standard_unit)
  -- Format: { "mmol/L": 18.0182 } means value_in_standard = value_in_source * factor
  unit_conversions JSONB DEFAULT '{}',

  -- Reference ranges by gender
  -- Format: { "male": { "low": 70, "high": 100 }, "female": { "low": 70, "high": 100 } }
  reference_ranges JSONB NOT NULL,

  -- Medical information
  description TEXT, -- What this biomarker measures
  clinical_significance TEXT, -- What abnormal values might indicate

  -- Formatting preferences
  decimal_places INTEGER DEFAULT 1, -- How many decimal places to show

  -- Display
  display_order INTEGER DEFAULT 1000, -- For sorting in UI

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.biomarker_standards ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_biomarker_standards_code ON public.biomarker_standards(code);
CREATE INDEX IF NOT EXISTS idx_biomarker_standards_category ON public.biomarker_standards(category);

-- Everyone can read biomarker standards (it's reference data)
DROP POLICY IF EXISTS "Anyone can read biomarker standards" ON public.biomarker_standards;
CREATE POLICY "Anyone can read biomarker standards"
  ON public.biomarker_standards
  FOR SELECT
  USING (true);

-- Create the generic updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger for updated_at
DROP TRIGGER IF EXISTS update_biomarker_standards_updated_at ON public.biomarker_standards;
CREATE TRIGGER update_biomarker_standards_updated_at
  BEFORE UPDATE ON public.biomarker_standards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.biomarker_standards IS 'Standardized biomarker definitions with units and reference ranges';
COMMENT ON COLUMN public.biomarker_standards.code IS 'Unique identifier code for the biomarker';
COMMENT ON COLUMN public.biomarker_standards.aliases IS 'Alternative names used to match extracted biomarkers';
COMMENT ON COLUMN public.biomarker_standards.unit_conversions IS 'Conversion factors from other units to standard_unit';
COMMENT ON COLUMN public.biomarker_standards.reference_ranges IS 'Normal ranges by gender: {"male": {"low": n, "high": n}, "female": {"low": n, "high": n}}';
