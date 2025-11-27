-- Add missing columns to user_settings table

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_settings'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.user_settings
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add temperature column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_settings'
    AND column_name = 'temperature'
  ) THEN
    ALTER TABLE public.user_settings
    ADD COLUMN temperature NUMERIC DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 1);
  END IF;
END $$;

-- Add encrypted_api_key column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_settings'
    AND column_name = 'encrypted_api_key'
  ) THEN
    ALTER TABLE public.user_settings
    ADD COLUMN encrypted_api_key TEXT;
  END IF;
END $$;

-- Create index on user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Add unique constraint on user_id (required for upsert)
-- Using direct ALTER TABLE with IF NOT EXISTS pattern
DO $$
BEGIN
  ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;
