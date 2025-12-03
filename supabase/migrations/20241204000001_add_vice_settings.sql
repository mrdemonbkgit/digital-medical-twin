-- Add vice tracking settings to user_settings
-- vice_tracking_enabled: must be manually enabled by user (default: false)
-- include_vice_in_ai: whether to include vice data in AI context (default: true when vice is enabled)

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS vice_tracking_enabled BOOLEAN DEFAULT false;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS include_vice_in_ai BOOLEAN DEFAULT true;
