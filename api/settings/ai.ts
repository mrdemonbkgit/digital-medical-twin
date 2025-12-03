import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withLogger, LoggedRequest } from '../lib/logger/withLogger.js';
import {
  createSupabaseClient,
  getUserId,
  SupabaseClientAny,
} from '../lib/supabase.js';

// Valid values for reasoning parameters
// Note: OpenAI gpt-5.1 does not support 'minimal' reasoning effort
const VALID_OPENAI_REASONING_EFFORTS = ['none', 'low', 'medium', 'high'];
const VALID_GEMINI_THINKING_LEVELS = ['low', 'high'];

// Get allowed origin for CORS
function getAllowedOrigin(req: VercelRequest): string {
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN || 'https://digital-medical-twin.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }
  return allowedOrigins[0];
}

async function handler(req: LoggedRequest, res: VercelResponse) {
  const log = req.log.child('AISettings');
  // CORS headers
  const allowedOrigin = getAllowedOrigin(req);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    const supabase = createSupabaseClient(authHeader);
    const userId = await getUserId(supabase, authHeader);

    if (req.method === 'GET') {
      // Get AI settings
      const { data, error } = await supabase
        .from('user_settings')
        .select('ai_provider, ai_model, openai_reasoning_effort, gemini_thinking_level')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return res.status(200).json({
        provider: data?.ai_provider || null,
        model: data?.ai_model || null,
        openaiReasoningEffort: data?.openai_reasoning_effort || 'medium',
        geminiThinkingLevel: data?.gemini_thinking_level || 'high',
      });
    }

    if (req.method === 'PUT') {
      const { provider, model, openaiReasoningEffort, geminiThinkingLevel } = req.body;

      // Validate input
      if (provider && !['openai', 'google'].includes(provider)) {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      if (openaiReasoningEffort && !VALID_OPENAI_REASONING_EFFORTS.includes(openaiReasoningEffort)) {
        return res.status(400).json({ error: 'Invalid OpenAI reasoning effort' });
      }

      if (geminiThinkingLevel && !VALID_GEMINI_THINKING_LEVELS.includes(geminiThinkingLevel)) {
        return res.status(400).json({ error: 'Invalid Gemini thinking level' });
      }

      // Build update object
      const updates: Record<string, unknown> = {
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      if (provider !== undefined) updates.ai_provider = provider;
      if (model !== undefined) updates.ai_model = model;
      if (openaiReasoningEffort !== undefined) updates.openai_reasoning_effort = openaiReasoningEffort;
      if (geminiThinkingLevel !== undefined) updates.gemini_thinking_level = geminiThinkingLevel;

      // Upsert settings
      const { error } = await supabase.from('user_settings').upsert(updates, {
        onConflict: 'user_id',
      });

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        provider: updates.ai_provider,
        model: updates.ai_model,
        openaiReasoningEffort: updates.openai_reasoning_effort,
        geminiThinkingLevel: updates.gemini_thinking_level,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    log.error('AI Settings API error', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withLogger(handler);
