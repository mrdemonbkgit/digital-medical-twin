-- Add provider-specific reasoning parameters to user_settings
-- These replace the generic temperature parameter for new AI models

-- Add OpenAI reasoning effort column (if not exists is handled by migration runner)
ALTER TABLE public.user_settings ADD COLUMN openai_reasoning_effort TEXT DEFAULT 'medium';
ALTER TABLE public.user_settings ADD CONSTRAINT chk_openai_reasoning_effort
  CHECK (openai_reasoning_effort IN ('none', 'minimal', 'low', 'medium', 'high'));

-- Add Gemini thinking level column
ALTER TABLE public.user_settings ADD COLUMN gemini_thinking_level TEXT DEFAULT 'high';
ALTER TABLE public.user_settings ADD CONSTRAINT chk_gemini_thinking_level
  CHECK (gemini_thinking_level IN ('low', 'high'));
