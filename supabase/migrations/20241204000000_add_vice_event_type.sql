-- Add is_private column to events (for all event types)
-- Defaults to false for existing events, vice events will always be true
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Update the type CHECK constraint to include 'vice'
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE events ADD CONSTRAINT events_type_check
  CHECK (type IN ('lab_result', 'doctor_visit', 'medication', 'intervention', 'metric', 'vice'));

-- Add vice-specific columns (namespaced to avoid conflicts with existing columns)
-- vice_category: type of vice (alcohol, pornography, smoking, drugs)
-- vice_quantity: numeric amount (drinks, minutes, cigarettes, etc.)
-- vice_unit: unit of measurement
-- vice_context: situational context (social, stress, boredom, etc.)
-- vice_trigger: what prompted the behavior
ALTER TABLE events ADD COLUMN IF NOT EXISTS vice_category TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS vice_quantity DECIMAL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS vice_unit TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS vice_context TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS vice_trigger TEXT;

-- Add constraint for vice_category values
ALTER TABLE events ADD CONSTRAINT events_vice_category_check
  CHECK (vice_category IS NULL OR vice_category IN ('alcohol', 'pornography', 'smoking', 'drugs'));

-- Index for efficient privacy filtering
CREATE INDEX IF NOT EXISTS idx_events_is_private ON events(user_id, is_private);

-- Index for vice-specific queries
CREATE INDEX IF NOT EXISTS idx_events_vice_category ON events(user_id, vice_category) WHERE type = 'vice';
