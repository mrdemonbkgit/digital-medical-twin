import { supabase } from '@/lib/supabase';
import type {
  AISettings,
  AIProvider,
  AIModel,
  OpenAIReasoningEffort,
  GeminiThinkingLevel,
} from '@/types/ai';

export async function getAISettings(): Promise<AISettings> {
  // Require authentication and scope to current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('ai_provider, ai_model, openai_reasoning_effort, gemini_thinking_level, agentic_mode')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  // data is null if user has no settings yet
  return {
    provider: (data?.ai_provider as AIProvider) || null,
    model: (data?.ai_model as AIModel) || null,
    openaiReasoningEffort: (data?.openai_reasoning_effort as OpenAIReasoningEffort) || 'medium',
    geminiThinkingLevel: (data?.gemini_thinking_level as GeminiThinkingLevel) || 'high',
    agenticMode: data?.agentic_mode ?? true, // Default to true (agentic mode on)
  };
}

export async function updateAISettings(updates: {
  provider?: AIProvider | null;
  model?: AIModel | null;
  openaiReasoningEffort?: OpenAIReasoningEffort;
  geminiThinkingLevel?: GeminiThinkingLevel;
  agenticMode?: boolean;
}): Promise<Partial<AISettings>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Build update object with snake_case keys
  const dbUpdates: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (updates.provider !== undefined) dbUpdates.ai_provider = updates.provider;
  if (updates.model !== undefined) dbUpdates.ai_model = updates.model;
  if (updates.openaiReasoningEffort !== undefined)
    dbUpdates.openai_reasoning_effort = updates.openaiReasoningEffort;
  if (updates.geminiThinkingLevel !== undefined)
    dbUpdates.gemini_thinking_level = updates.geminiThinkingLevel;
  if (updates.agenticMode !== undefined) dbUpdates.agentic_mode = updates.agenticMode;

  const { error } = await supabase.from('user_settings').upsert(dbUpdates, {
    onConflict: 'user_id',
  });

  if (error) {
    throw new Error(error.message);
  }

  // Return only the fields that were updated - let the hook preserve existing state for others
  return {
    provider: updates.provider !== undefined ? updates.provider : undefined,
    model: updates.model !== undefined ? updates.model : undefined,
    openaiReasoningEffort: updates.openaiReasoningEffort,
    geminiThinkingLevel: updates.geminiThinkingLevel,
    agenticMode: updates.agenticMode,
  };
}
