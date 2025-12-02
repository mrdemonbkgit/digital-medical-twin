-- Add AI settings columns to conversations table
-- Stores model/provider settings per conversation for session persistence

ALTER TABLE public.ai_conversations
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS reasoning_effort TEXT,
  ADD COLUMN IF NOT EXISTS thinking_level TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.ai_conversations.provider IS 'AI provider (openai, google)';
COMMENT ON COLUMN public.ai_conversations.model IS 'Specific model name';
COMMENT ON COLUMN public.ai_conversations.reasoning_effort IS 'OpenAI reasoning effort (low, medium, high)';
COMMENT ON COLUMN public.ai_conversations.thinking_level IS 'Gemini thinking level (none, low, medium, high)';
