-- Remove 'minimal' from openai_reasoning_effort options
-- OpenAI gpt-5.1 does not support 'minimal' reasoning effort

-- First, update any existing 'minimal' values to 'low'
UPDATE public.user_settings
SET openai_reasoning_effort = 'low'
WHERE openai_reasoning_effort = 'minimal';

-- Drop the old constraint
ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS chk_openai_reasoning_effort;

-- Add new constraint without 'minimal'
ALTER TABLE public.user_settings ADD CONSTRAINT chk_openai_reasoning_effort
  CHECK (openai_reasoning_effort IN ('none', 'low', 'medium', 'high'));
