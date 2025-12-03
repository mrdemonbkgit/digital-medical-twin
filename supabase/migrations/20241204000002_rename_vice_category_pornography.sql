-- Rename vice category 'pornography' to 'masturbation'

-- First, migrate existing data
UPDATE events SET vice_category = 'masturbation' WHERE vice_category = 'pornography';

-- Drop the old constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_vice_category_check;

-- Add the new constraint with 'masturbation' instead of 'pornography'
ALTER TABLE events ADD CONSTRAINT events_vice_category_check
  CHECK (vice_category IS NULL OR vice_category IN ('alcohol', 'masturbation', 'smoking', 'drugs'));
