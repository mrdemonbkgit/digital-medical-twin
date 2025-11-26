-- Events table (single table inheritance)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lab_result', 'doctor_visit', 'medication', 'intervention', 'metric')),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Lab Result fields
  lab_name TEXT,
  ordering_doctor TEXT,
  biomarkers JSONB DEFAULT '[]',

  -- Doctor Visit fields
  doctor_name TEXT,
  specialty TEXT,
  facility TEXT,
  diagnosis TEXT[],
  follow_up TEXT,

  -- Medication fields
  medication_name TEXT,
  dosage TEXT,
  frequency TEXT,
  prescriber TEXT,
  reason TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  side_effects TEXT[],

  -- Intervention fields
  intervention_name TEXT,
  category TEXT CHECK (category IS NULL OR category IN ('diet', 'exercise', 'supplement', 'sleep', 'stress', 'other')),
  protocol TEXT,

  -- Metric fields
  source TEXT CHECK (source IS NULL OR source IN ('whoop', 'oura', 'apple_health', 'garmin', 'manual')),
  metric_name TEXT,
  value NUMERIC,
  unit TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_user_date ON public.events(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_type ON public.events(user_id, type);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS policy - users can only access their own events
CREATE POLICY "Users can manage own events" ON public.events
  FOR ALL USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
