-- Create user_profiles table for comprehensive user health data
-- This data is used for gender-specific biomarker reference ranges and AI analysis

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  display_name TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE NOT NULL,
  height_cm DECIMAL(5,1),              -- Height in centimeters
  weight_kg DECIMAL(5,1),              -- Weight in kilograms

  -- Medical History (arrays for multiple entries)
  medical_conditions TEXT[] DEFAULT '{}',   -- e.g., ["Type 2 Diabetes", "Hypertension"]
  current_medications TEXT[] DEFAULT '{}',  -- e.g., ["Metformin 500mg", "Lisinopril 10mg"]
  allergies TEXT[] DEFAULT '{}',            -- e.g., ["Penicillin", "Shellfish"]
  surgical_history TEXT[] DEFAULT '{}',     -- e.g., ["Appendectomy 2015"]

  -- Family History (JSONB for flexible structure)
  -- Format: {"condition": ["relative1", "relative2"]}
  -- e.g., {"heart_disease": ["father"], "diabetes": ["mother", "grandmother"]}
  family_history JSONB DEFAULT '{}',

  -- Lifestyle factors
  smoking_status TEXT CHECK (smoking_status IS NULL OR smoking_status IN ('never', 'former', 'current')),
  alcohol_frequency TEXT CHECK (alcohol_frequency IS NULL OR alcohol_frequency IN ('never', 'occasional', 'moderate', 'heavy')),
  exercise_frequency TEXT CHECK (exercise_frequency IS NULL OR exercise_frequency IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),

  -- Profile completion tracking
  profile_complete BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_gender ON public.user_profiles(gender);

-- RLS Policy: Users can only access their own profile
DROP POLICY IF EXISTS "Users can manage own profile" ON public.user_profiles;
CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Grant permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
