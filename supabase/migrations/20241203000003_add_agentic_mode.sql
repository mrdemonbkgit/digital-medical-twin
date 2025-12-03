-- Add agentic_mode to user_settings (global default)
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS agentic_mode BOOLEAN DEFAULT true;

-- Add agentic_mode to ai_conversations (per-conversation override)
ALTER TABLE ai_conversations
ADD COLUMN IF NOT EXISTS agentic_mode BOOLEAN;
