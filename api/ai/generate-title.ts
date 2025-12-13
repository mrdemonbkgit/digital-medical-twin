import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withLogger, LoggedRequest } from '../lib/logger/withLogger.js';
import { createSupabaseClient, getUserId } from '../lib/supabase.js';

// Create a child logger for this module
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

// Title generation prompt - designed to produce concise, descriptive titles
const TITLE_PROMPT = `Generate a short, descriptive title (3-5 words) for a conversation that starts with this message.
The title should capture the main topic or intent.
Respond with ONLY the title, no quotes, no punctuation at the end, no explanation.

Examples:
- "What are my cholesterol levels?" → "Cholesterol Levels Review"
- "Summarize my health history for my new doctor" → "Health History Summary"
- "How has my blood pressure changed over time?" → "Blood Pressure Trends"
- "What medications am I taking?" → "Current Medications List"

User message:`;

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

// Generate title using OpenAI (fast, cheap model)
async function generateTitleOpenAI(message: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: `${TITLE_PROMPT}\n"${message}"` },
      ],
      max_tokens: 20,
      temperature: 0.3, // Low temperature for consistent results
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI request failed');
  }

  const data = await response.json();
  const title = data.choices?.[0]?.message?.content?.trim() || '';

  // Clean up the title (remove quotes if present)
  return title.replace(/^["']|["']$/g, '').trim();
}

// Generate title using Gemini (fast, cheap model)
async function generateTitleGemini(message: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${TITLE_PROMPT}\n"${message}"` }] },
        ],
        generationConfig: {
          maxOutputTokens: 20,
          temperature: 0.3,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini request failed');
  }

  const data = await response.json();
  const title = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

  // Clean up the title (remove quotes if present)
  return title.replace(/^["']|["']$/g, '').trim();
}

async function handler(req: LoggedRequest, res: VercelResponse) {
  const log = req.log.child('GenerateTitle');

  // CORS headers
  const allowedOrigin = getAllowedOrigin(req);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    const supabase = createSupabaseClient(authHeader);
    const userId = await getUserId(supabase, authHeader);

    const { message, conversationId } = req.body as {
      message: string;
      conversationId: string;
    };

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!conversationId || typeof conversationId !== 'string') {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .select('id, title')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get user's preferred AI provider
    const { data: settings } = await supabase
      .from('user_settings')
      .select('ai_provider')
      .eq('user_id', userId)
      .single();

    const provider = settings?.ai_provider || 'openai';

    // Generate title using the appropriate provider
    let title: string;
    try {
      if (provider === 'google' && GOOGLE_API_KEY) {
        title = await generateTitleGemini(message);
      } else if (OPENAI_API_KEY) {
        title = await generateTitleOpenAI(message);
      } else {
        // Fallback: use first 50 chars
        title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
      }
    } catch (genError) {
      log.warn('Title generation failed, using fallback', { error: genError });
      // Fallback: use first 50 chars
      title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
    }

    // Ensure title isn't too long (max 100 chars)
    if (title.length > 100) {
      title = title.slice(0, 97) + '...';
    }

    // Update conversation title
    const { error: updateError } = await supabase
      .from('ai_conversations')
      .update({ title })
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (updateError) {
      log.error('Failed to update conversation title', updateError);
      throw updateError;
    }

    log.info('Generated conversation title', {
      conversationId,
      titleLength: title.length,
      provider,
    });

    return res.status(200).json({ title });
  } catch (error) {
    log.error('Generate title failed', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(500).json({ error: 'Failed to generate title' });
  }
}

export default withLogger(handler);
