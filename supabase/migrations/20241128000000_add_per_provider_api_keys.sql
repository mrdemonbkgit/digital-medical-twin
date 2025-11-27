-- Add per-provider API key columns for multi-provider support

-- Add encrypted_openai_key column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_settings'
    AND column_name = 'encrypted_openai_key'
  ) THEN
    ALTER TABLE public.user_settings
    ADD COLUMN encrypted_openai_key TEXT;
  END IF;
END $$;

-- Add encrypted_google_key column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_settings'
    AND column_name = 'encrypted_google_key'
  ) THEN
    ALTER TABLE public.user_settings
    ADD COLUMN encrypted_google_key TEXT;
  END IF;
END $$;

-- Migrate existing keys to provider-specific columns based on current ai_provider
-- This preserves existing user configurations
UPDATE public.user_settings
SET encrypted_openai_key = encrypted_api_key
WHERE ai_provider = 'openai'
  AND encrypted_api_key IS NOT NULL
  AND encrypted_openai_key IS NULL;

UPDATE public.user_settings
SET encrypted_google_key = encrypted_api_key
WHERE ai_provider = 'google'
  AND encrypted_api_key IS NOT NULL
  AND encrypted_google_key IS NULL;

-- Note: Keep encrypted_api_key column for backward compatibility
-- It can be deprecated and removed in a future migration
