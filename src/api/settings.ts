// User Settings API - Phase 4 implementation for AI settings
// This file is a placeholder

export interface UserSettings {
  aiProvider: 'openai' | 'google';
  aiModel: string;
  theme: 'light' | 'dark' | 'system';
}

export async function getSettings(): Promise<UserSettings> {
  // TODO: Implement with Supabase
  return {
    aiProvider: 'openai',
    aiModel: 'gpt-5.1',
    theme: 'system',
  };
}

export async function updateSettings(_settings: Partial<UserSettings>): Promise<UserSettings> {
  // TODO: Implement with Supabase
  throw new Error('Not implemented');
}
