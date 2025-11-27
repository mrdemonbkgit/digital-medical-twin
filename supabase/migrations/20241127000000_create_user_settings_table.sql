-- User Settings table for AI configuration and app preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- AI Configuration
  ai_provider TEXT CHECK (ai_provider IS NULL OR ai_provider IN ('openai', 'google')),
  ai_model TEXT,
  temperature NUMERIC DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 1),

  -- Encrypted API key (server-side encryption via Vercel functions)
  -- This is encrypted using AES-256-GCM before storage
  encrypted_api_key TEXT,

  -- App preferences
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger (reuses function from events migration)
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
