import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Types
interface ProviderMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ReasoningStep {
  title: string;
  content?: string;
}

interface ToolCallResult {
  id: string;
  type: string;
  name: string;
  arguments?: Record<string, unknown>;
  result?: string;
  status: 'pending' | 'completed' | 'failed';
}

interface WebSearchResultItem {
  title: string;
  url: string;
  snippet: string;
  displayUrl?: string;
}

interface ExtendedAIResponse {
  content: string;
  tokensUsed: number;
  reasoning?: { id: string; steps: ReasoningStep[] };
  toolCalls?: ToolCallResult[];
  webSearchResults?: WebSearchResultItem[];
  citations?: Array<{
    startIndex: number;
    endIndex: number;
    text: string;
    sourceIndices: number[];
    confidence: number;
  }>;
}

interface HealthEvent {
  id: string;
  type: string;
  date: string;
  title: string;
  notes?: string;
  tags?: string[];
  [key: string]: unknown;
}

// Encryption utilities
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

async function decrypt(encryptedData: string, key: string): Promise<string> {
  const combined = Buffer.from(encryptedData, 'base64');
  const iv = combined.subarray(0, 12);
  const ciphertext = combined.subarray(12);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    Buffer.from(key, 'base64'),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    cryptoKey,
    new Uint8Array(ciphertext)
  );

  return new TextDecoder().decode(decrypted);
}

// Supabase client
function createSupabaseClient(authHeader: string | undefined) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

async function getUserId(supabase: ReturnType<typeof createClient>, authHeader: string) {
  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) throw new Error('Unauthorized');
  return user.id;
}

// System prompt for AI Historian
const SYSTEM_PROMPT = `You are a personal health historian assistant. Your role is to help users understand and analyze their health data over time.

Guidelines:
- Be helpful, empathetic, and thorough in your analysis
- Always base your responses on the provided health context
- If asked about data not in the context, clearly state you don't have that information
- Never provide medical diagnoses or treatment recommendations
- Suggest consulting healthcare providers for medical decisions
- Highlight trends and patterns you observe in the data
- Be precise about dates and values when discussing specific events
- If the context is truncated, mention that there may be additional relevant data not shown

You have access to the user's health timeline including lab results, doctor visits, medications, interventions, and health metrics.`;

// Format events for context
function formatEventsForContext(events: HealthEvent[]): string {
  if (events.length === 0) {
    return 'No health events found matching the query criteria.';
  }

  return events
    .map((event) => {
      const lines = [`[${event.type.toUpperCase()}] ${event.date}: ${event.title}`];

      if (event.notes) lines.push(`Notes: ${event.notes}`);
      if (event.tags?.length) lines.push(`Tags: ${event.tags.join(', ')}`);

      // Add type-specific details
      switch (event.type) {
        case 'lab_result':
          if (event.labName) lines.push(`Lab: ${event.labName}`);
          if (event.biomarkers && Array.isArray(event.biomarkers)) {
            lines.push('Biomarkers:');
            for (const b of event.biomarkers as Array<{
              name: string;
              value: number;
              unit: string;
              flag?: string;
            }>) {
              const flag = b.flag && b.flag !== 'normal' ? ` (${b.flag})` : '';
              lines.push(`  - ${b.name}: ${b.value} ${b.unit}${flag}`);
            }
          }
          break;
        case 'doctor_visit':
          if (event.doctorName) lines.push(`Doctor: ${event.doctorName}`);
          if (event.specialty) lines.push(`Specialty: ${event.specialty}`);
          if (event.diagnosis && Array.isArray(event.diagnosis)) {
            lines.push(`Diagnosis: ${(event.diagnosis as string[]).join(', ')}`);
          }
          break;
        case 'medication':
          if (event.medicationName) lines.push(`Medication: ${event.medicationName}`);
          if (event.dosage) lines.push(`Dosage: ${event.dosage} ${event.frequency || ''}`);
          break;
        case 'intervention':
          if (event.interventionName) lines.push(`Intervention: ${event.interventionName}`);
          if (event.category) lines.push(`Category: ${event.category}`);
          break;
        case 'metric':
          if (event.metricName) lines.push(`Metric: ${event.metricName}`);
          if (event.value !== undefined) lines.push(`Value: ${event.value} ${event.unit || ''}`);
          break;
      }

      return lines.join('\n');
    })
    .join('\n\n---\n\n');
}

// OpenAI Responses API completion (supports reasoning, tools, web search)
// Note: temperature is not supported in Responses API
async function openaiComplete(
  apiKey: string,
  model: string,
  messages: ProviderMessage[],
  _temperature: number // Prefixed with _ since not used in Responses API
): Promise<ExtendedAIResponse> {
  // Extract system messages for instructions
  const systemMessages = messages.filter((m) => m.role === 'system');
  const instructions = systemMessages.map((m) => m.content).join('\n\n');

  // Build input from non-system messages
  const input = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));

  // Use Responses API for extended capabilities
  // Note: temperature is not supported in Responses API
  // reasoning.summary: "auto" enables reasoning summaries (works with o3, o4-mini, etc.)
  const requestBody: Record<string, unknown> = {
    model,
    input,
    instructions,
    max_output_tokens: 2000,
    tools: [{ type: 'web_search_preview' }],
  };

  // Only add reasoning summary for models that support it (o-series models)
  if (model.startsWith('o')) {
    requestBody.reasoning = { summary: 'auto' };
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `OpenAI request failed: ${response.status}`);
  }

  const data = await response.json();

  // Debug logging to see response structure
  console.log('OpenAI Responses API output:', JSON.stringify(data.output, null, 2));

  // Extract content from output items
  const content = extractOpenAIOutputText(data.output);
  const reasoning = extractOpenAIReasoning(data);
  const toolCalls = extractOpenAIToolCalls(data.output);
  const webSearchResults = extractOpenAIWebSearch(data.output);

  return {
    content,
    tokensUsed: data.usage?.total_tokens || 0,
    reasoning,
    toolCalls,
    webSearchResults,
  };
}

// Extract text content from OpenAI Responses API output
function extractOpenAIOutputText(output: unknown[]): string {
  if (!Array.isArray(output)) return '';

  const textParts: string[] = [];
  for (const item of output) {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      if (obj.type === 'message' && obj.content) {
        const content = obj.content as Array<{ type: string; text?: string }>;
        for (const part of content) {
          if (part.type === 'output_text' && part.text) {
            textParts.push(part.text);
          }
        }
      }
    }
  }
  return textParts.join('\n');
}

// Extract reasoning from OpenAI response
function extractOpenAIReasoning(data: Record<string, unknown>): { id: string; steps: ReasoningStep[] } | undefined {
  const output = data.output as unknown[];
  if (!Array.isArray(output)) return undefined;

  const steps: ReasoningStep[] = [];

  for (const item of output) {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      if (obj.type === 'reasoning') {
        // Parse reasoning summary into steps
        const summary = obj.summary as Array<{ type: string; text?: string }>;
        if (Array.isArray(summary)) {
          for (const part of summary) {
            if (part.type === 'summary_text' && part.text) {
              // Split summary into steps by sentences
              const sentences = part.text.split(/(?<=[.!?])\s+/);
              for (const sentence of sentences) {
                if (sentence.trim()) {
                  steps.push({ title: sentence.trim() });
                }
              }
            }
          }
        }
      }
    }
  }

  if (steps.length === 0) return undefined;

  return { id: 'reasoning-1', steps };
}

// Extract tool calls from OpenAI output
function extractOpenAIToolCalls(output: unknown[]): ToolCallResult[] | undefined {
  if (!Array.isArray(output)) return undefined;

  const toolCalls: ToolCallResult[] = [];

  for (const item of output) {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      if (obj.type === 'function_call') {
        toolCalls.push({
          id: (obj.call_id as string) || `tool-${toolCalls.length}`,
          type: 'function',
          name: (obj.name as string) || 'Unknown',
          arguments: typeof obj.arguments === 'string' ? JSON.parse(obj.arguments) : obj.arguments as Record<string, unknown>,
          status: 'completed',
        });
      } else if (obj.type === 'function_call_output') {
        // Find matching tool call and add result
        const callId = obj.call_id as string;
        const existing = toolCalls.find((t) => t.id === callId);
        if (existing) {
          existing.result = obj.output as string;
        }
      }
    }
  }

  return toolCalls.length > 0 ? toolCalls : undefined;
}

// Extract web search results from OpenAI output
function extractOpenAIWebSearch(output: unknown[]): WebSearchResultItem[] | undefined {
  if (!Array.isArray(output)) return undefined;

  const results: WebSearchResultItem[] = [];

  for (const item of output) {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      if (obj.type === 'web_search_call') {
        // Web search was performed - look for results in next items
        continue;
      }
      if (obj.type === 'message' && obj.content) {
        const content = obj.content as Array<{ type: string; annotations?: unknown[] }>;
        for (const part of content) {
          if (part.annotations && Array.isArray(part.annotations)) {
            for (const annotation of part.annotations) {
              const ann = annotation as Record<string, unknown>;
              if (ann.type === 'url_citation') {
                results.push({
                  title: (ann.title as string) || '',
                  url: (ann.url as string) || '',
                  snippet: '',
                  displayUrl: ann.url as string,
                });
              }
            }
          }
        }
      }
    }
  }

  return results.length > 0 ? results : undefined;
}

// Format elapsed time as "Xm Ys" or "Xs"
function formatElapsedTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

// Gemini completion with thinking and Google Search grounding
async function geminiComplete(
  apiKey: string,
  model: string,
  messages: ProviderMessage[],
  temperature: number
): Promise<ExtendedAIResponse> {
  // Separate system instruction from messages
  let systemInstruction = '';
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstruction += (systemInstruction ? '\n\n' : '') + msg.content;
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: 2000,
          thinkingConfig: { thinkingBudget: 1024 },
        },
        tools: [{ googleSearch: {} }],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Gemini request failed: ${response.status}`);
  }

  const data = await response.json();

  // Extract content, reasoning, and grounding
  const content = extractGeminiContent(data);
  const reasoning = extractGeminiThinking(data);
  const groundingResult = extractGeminiGrounding(data);

  return {
    content,
    tokensUsed: data.usageMetadata?.totalTokenCount || 0,
    reasoning,
    webSearchResults: groundingResult?.sources,
    citations: groundingResult?.citations,
  };
}

// Extract main content from Gemini response
function extractGeminiContent(data: Record<string, unknown>): string {
  const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
  if (!candidates?.[0]?.content?.parts) return '';

  // Filter out thinking parts, only get regular content
  return candidates[0].content.parts
    .filter((p) => !p.thought && p.text)
    .map((p) => p.text)
    .join('');
}

// Extract thinking content from Gemini response
function extractGeminiThinking(data: Record<string, unknown>): { id: string; steps: ReasoningStep[] } | undefined {
  const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
  if (!candidates?.[0]?.content?.parts) return undefined;

  const thinkingParts = candidates[0].content.parts.filter((p) => p.thought && p.text);

  if (thinkingParts.length === 0) return undefined;

  const steps: ReasoningStep[] = [];
  for (const part of thinkingParts) {
    if (part.text) {
      // Split thinking into steps by sentences or paragraphs
      const sentences = part.text.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        if (sentence.trim()) {
          steps.push({ title: sentence.trim() });
        }
      }
    }
  }

  return steps.length > 0 ? { id: 'thinking-1', steps } : undefined;
}

// Inline citation type for grounding
interface InlineCitationResult {
  startIndex: number;
  endIndex: number;
  text: string;
  sourceIndices: number[];
  confidence: number;
}

// Result structure for Gemini grounding extraction
interface GeminiGroundingResult {
  sources: WebSearchResultItem[];
  citations: InlineCitationResult[];
  searchQueries: string[];
}

// Extract grounding (web search) results and inline citations from Gemini response
function extractGeminiGrounding(data: Record<string, unknown>): GeminiGroundingResult | undefined {
  const candidates = data.candidates as Array<{
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
      groundingSupports?: Array<{
        segment?: { startIndex?: number; endIndex?: number; text?: string };
        groundingChunkIndices?: number[];
        confidenceScores?: number[];
      }>;
      webSearchQueries?: string[];
    };
  }>;

  const groundingMetadata = candidates?.[0]?.groundingMetadata;
  if (!groundingMetadata) return undefined;

  const sources: WebSearchResultItem[] = [];
  const citations: InlineCitationResult[] = [];

  // Extract ALL sources from groundingChunks (don't filter vertexaisearch URLs - they have titles)
  if (groundingMetadata.groundingChunks) {
    for (const chunk of groundingMetadata.groundingChunks) {
      if (chunk.web) {
        const uri = chunk.web.uri || '';
        const title = chunk.web.title || '';

        // Use the title from Gemini, fall back to extracting from URL
        let displayTitle = title;
        if (!displayTitle && uri) {
          try {
            displayTitle = new URL(uri).hostname.replace('www.', '');
          } catch {
            displayTitle = uri;
          }
        }

        sources.push({
          title: displayTitle,
          url: uri,
          snippet: '',
          displayUrl: displayTitle,
        });
      }
    }
  }

  // Extract inline citations from groundingSupports
  if (groundingMetadata.groundingSupports) {
    for (const support of groundingMetadata.groundingSupports) {
      if (support.segment && support.groundingChunkIndices?.length) {
        const avgConfidence = support.confidenceScores?.length
          ? support.confidenceScores.reduce((a, b) => a + b, 0) / support.confidenceScores.length
          : 1;

        citations.push({
          startIndex: support.segment.startIndex || 0,
          endIndex: support.segment.endIndex || 0,
          text: support.segment.text || '',
          sourceIndices: support.groundingChunkIndices,
          confidence: avgConfidence,
        });
      }
    }
  }

  // Sort citations by endIndex for proper insertion order
  citations.sort((a, b) => a.endIndex - b.endIndex);

  const searchQueries = groundingMetadata.webSearchQueries || [];

  // Return undefined if no meaningful data
  if (sources.length === 0 && citations.length === 0 && searchQueries.length === 0) {
    return undefined;
  }

  return { sources, citations, searchQueries };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
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

    // Get request body
    const { message, history = [] } = req.body as {
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user's AI settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('ai_provider, ai_model, temperature, encrypted_openai_key, encrypted_google_key, encrypted_api_key')
      .eq('user_id', userId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    if (!settings?.ai_provider) {
      return res.status(400).json({
        error: 'AI not configured. Please select a provider in Settings.',
      });
    }

    // Get provider-specific encrypted key (fallback to legacy encrypted_api_key for backward compatibility)
    const provider = settings.ai_provider as 'openai' | 'google';
    const encryptedKey =
      provider === 'openai'
        ? settings.encrypted_openai_key || settings.encrypted_api_key
        : settings.encrypted_google_key || settings.encrypted_api_key;

    if (!encryptedKey) {
      return res.status(400).json({
        error: `API key not configured for ${provider === 'openai' ? 'OpenAI' : 'Google'}. Please add your API key in Settings.`,
      });
    }

    // Decrypt API key
    if (!ENCRYPTION_KEY) {
      return res.status(500).json({ error: 'Encryption not configured' });
    }

    const apiKey = await decrypt(encryptedKey, ENCRYPTION_KEY);

    // Fetch user's health events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100);

    if (eventsError) {
      throw eventsError;
    }

    // Build context from events
    const context = formatEventsForContext(events || []);
    const eventCount = events?.length || 0;
    const truncated = eventCount >= 100;

    // Build messages for AI
    const contextHeader = `The following is the user's health timeline (${eventCount} events${truncated ? ', showing most recent 100' : ''}):\n\n`;

    const messages: ProviderMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: contextHeader + context },
      ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: message },
    ];

    // Call AI provider and track elapsed time
    const model = settings.ai_model || (provider === 'openai' ? 'gpt-5.1' : 'gemini-3-pro-preview');
    const temperature = settings.temperature || 0.7;

    const startTime = Date.now();
    let result: ExtendedAIResponse;

    if (provider === 'openai') {
      result = await openaiComplete(apiKey, model, messages, temperature);
    } else {
      result = await geminiComplete(apiKey, model, messages, temperature);
    }

    const elapsedMs = Date.now() - startTime;
    const elapsedTime = formatElapsedTime(elapsedMs);

    // Extract source events (simple heuristic: mentioned dates/titles)
    const sources: Array<{ eventId: string; type: string; date: string; title: string }> = [];
    if (events) {
      for (const event of events) {
        if (
          result.content.includes(event.date) ||
          result.content.toLowerCase().includes(event.title.toLowerCase())
        ) {
          sources.push({
            eventId: event.id,
            type: event.type,
            date: event.date,
            title: event.title,
          });
          if (sources.length >= 5) break; // Limit sources
        }
      }
    }

    return res.status(200).json({
      content: result.content,
      tokensUsed: result.tokensUsed,
      sources,
      reasoning: result.reasoning,
      toolCalls: result.toolCalls,
      webSearchResults: result.webSearchResults,
      citations: result.citations,
      elapsedTime,
    });
  } catch (error) {
    console.error('AI Chat API error:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      if (error.message === 'Unauthorized') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      // Pass through AI provider errors
      if (error.message.includes('OpenAI') || error.message.includes('Gemini')) {
        return res.status(502).json({ error: error.message });
      }
      // Return actual error message for debugging
      return res.status(500).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
