import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { withLogger, LoggedRequest } from '../lib/logger/withLogger.js';
import { toOpenAITools, toGeminiTools } from './tools/definitions.js';
import { executeToolCall } from './tools/executor.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientAny = SupabaseClient<any, any, any>;

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

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

interface ExtendedAIResponse {
  content: string;
  tokensUsed: TokenUsage;
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

interface UserProfileRow {
  display_name: string | null;
  gender: string;
  date_of_birth: string;
  height_cm: number | null;
  weight_kg: number | null;
  medical_conditions: string[];
  current_medications: string[];
  allergies: string[];
  surgical_history: string[];
  family_history: Record<string, string[]> | null;
  smoking_status: string | null;
  alcohol_frequency: string | null;
  exercise_frequency: string | null;
}

// Server-side API keys (no longer using user-provided keys)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

// Reasoning parameter types
// Note: OpenAI gpt-5.1 only supports none, low, medium, high (not 'minimal')
type OpenAIReasoningEffort = 'none' | 'low' | 'medium' | 'high';
type GeminiThinkingLevel = 'low' | 'high';

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

async function getUserId(supabase: SupabaseClientAny, authHeader: string) {
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

You have access to:
1. The user's health profile (demographics, medical history, family history, lifestyle factors)
2. The user's health timeline including lab results, doctor visits, medications, interventions, and health metrics

Guidelines:
- Be helpful, empathetic, and thorough in your analysis
- Consider the user's age, gender, and medical conditions for personalized context
- Reference their current medications when discussing potential interactions or lab results
- Consider family history when discussing disease risks or preventive measures
- Account for lifestyle factors when analyzing health trends
- Always base your responses on the provided health context
- If asked about data not in the context, clearly state you don't have that information
- Never provide medical diagnoses or treatment recommendations
- Suggest consulting healthcare providers for medical decisions
- Highlight trends and patterns you observe in the data
- Be precise about dates and values when discussing specific events
- If the context is truncated, mention that there may be additional relevant data not shown`;

// Agentic system prompt - AI uses tools to retrieve data on-demand
const AGENTIC_SYSTEM_PROMPT = `You are a personal health historian assistant with access to tools to retrieve the user's health data on-demand.

## Available Tools
You have access to these tools to query the user's health data:
- **search_events**: Search health timeline by keywords, event types (lab_result, doctor_visit, medication, intervention, metric), or date range
- **get_biomarker_history**: Get historical values for a specific biomarker (e.g., cholesterol, glucose, HbA1c) to track trends over time
- **get_profile**: Get user profile including demographics, medical conditions, medications, allergies, family history, lifestyle
- **get_recent_labs**: Get recent lab results with all biomarker values
- **get_medications**: Get current or all medications
- **get_event_details**: Get full details of a specific event by ID

## Guidelines
1. **Use tools to fetch relevant data** before answering questions - don't guess or make assumptions
2. For trend questions (e.g., "how has my cholesterol changed"), use get_biomarker_history
3. For health context questions, use get_profile to understand the user's background
4. For finding specific events, use search_events then get_event_details if you need more details
5. Be thorough - fetch all data needed for a complete, accurate answer
6. If a tool returns no data, clearly state that the information is not available
7. Reference specific dates and values from the retrieved data
8. Highlight trends and patterns you observe
9. **Never provide medical diagnoses or treatment recommendations**
10. Suggest consulting healthcare providers for medical decisions`;

// Agentic mode configuration
const AGENTIC_MAX_ITERATIONS = Number(process.env.AI_MAX_TOOL_ITERATIONS) || 5;

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

// Format user profile for context
function formatUserProfileForContext(profile: UserProfileRow | null): string {
  if (!profile) {
    return '=== USER PROFILE ===\nNo profile available.\n=== END PROFILE ===';
  }

  // Calculate age from date of birth
  let age: number | null = null;
  if (profile.date_of_birth) {
    const today = new Date();
    const birthDate = new Date(profile.date_of_birth);
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  // Calculate BMI
  const bmi =
    profile.height_cm && profile.weight_kg
      ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1)
      : null;

  // Format family history
  let familyHistoryText = 'Family History: None listed';
  if (profile.family_history && Object.keys(profile.family_history).length > 0) {
    const entries = Object.entries(profile.family_history)
      .map(([condition, relatives]) => `  - ${condition.replace(/_/g, ' ')}: ${relatives.join(', ')}`)
      .join('\n');
    familyHistoryText = `Family History:\n${entries}`;
  }

  const sections: (string | null)[] = [
    '=== USER PROFILE ===',
    `Name: ${profile.display_name || 'Not provided'}`,
    age !== null ? `Age: ${age} years old` : null,
    `Gender: ${profile.gender || 'Not specified'}`,
    profile.height_cm ? `Height: ${profile.height_cm} cm` : null,
    profile.weight_kg ? `Weight: ${profile.weight_kg} kg` : null,
    bmi ? `BMI: ${bmi}` : null,
    '',
    'Medical History:',
    `- Conditions: ${profile.medical_conditions?.length ? profile.medical_conditions.join(', ') : 'None listed'}`,
    `- Current Medications: ${profile.current_medications?.length ? profile.current_medications.join(', ') : 'None listed'}`,
    `- Allergies: ${profile.allergies?.length ? profile.allergies.join(', ') : 'None listed'}`,
    `- Surgical History: ${profile.surgical_history?.length ? profile.surgical_history.join(', ') : 'None listed'}`,
    '',
    familyHistoryText,
    '',
    'Lifestyle:',
    `- Smoking: ${profile.smoking_status?.replace(/_/g, ' ') || 'Not specified'}`,
    `- Alcohol: ${profile.alcohol_frequency?.replace(/_/g, ' ') || 'Not specified'}`,
    `- Exercise: ${profile.exercise_frequency?.replace(/_/g, ' ') || 'Not specified'}`,
    '=== END PROFILE ===',
  ];

  return sections.filter((s) => s !== null).join('\n');
}

// OpenAI Responses API completion (supports reasoning, tools, web search)
async function openaiComplete(
  apiKey: string,
  model: string,
  messages: ProviderMessage[],
  reasoningEffort: OpenAIReasoningEffort = 'medium'
): Promise<ExtendedAIResponse> {
  // Extract system messages for instructions
  const systemMessages = messages.filter((m) => m.role === 'system');
  const instructions = systemMessages.map((m) => m.content).join('\n\n');

  // Build input from non-system messages
  const input = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));

  // Use Responses API for extended capabilities
  // reasoning_effort controls thinking depth for GPT-5.1
  const requestBody: Record<string, unknown> = {
    model,
    input,
    instructions,
    max_output_tokens: 16000,
    tools: [{ type: 'web_search_preview' }],
    reasoning: {
      effort: reasoningEffort,
      summary: 'auto',
    },
  };

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

  // Extract content from output items
  const content = extractOpenAIOutputText(data.output);
  const reasoning = extractOpenAIReasoning(data);
  const toolCalls = extractOpenAIToolCalls(data.output);
  const webSearchResults = extractOpenAIWebSearch(data.output);

  return {
    content,
    tokensUsed: {
      prompt: data.usage?.input_tokens || 0,
      completion: data.usage?.output_tokens || 0,
      total: data.usage?.total_tokens || 0,
    },
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

// Interface for pending tool calls extracted from AI response
interface PendingToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

// Extract pending function calls from OpenAI Responses API output
function extractOpenAIPendingToolCalls(output: unknown[]): PendingToolCall[] {
  if (!Array.isArray(output)) return [];

  const pending: PendingToolCall[] = [];

  for (const item of output) {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      if (obj.type === 'function_call') {
        const args = typeof obj.arguments === 'string'
          ? JSON.parse(obj.arguments)
          : (obj.arguments as Record<string, unknown>) || {};
        pending.push({
          id: (obj.call_id as string) || `call-${pending.length}`,
          name: (obj.name as string) || '',
          arguments: args,
        });
      }
    }
  }

  return pending;
}

// Build OpenAI input with tool results appended
function appendOpenAIToolResults(
  currentInput: Array<{ role: string; content: string }>,
  toolCalls: PendingToolCall[],
  results: Array<{ id: string; output: string }>
): Array<{ role: string; content: string } | { type: string; call_id: string; output: string }> {
  const newInput: Array<{ role: string; content: string } | { type: string; call_id: string; output: string }> = [...currentInput];

  // Add function call outputs
  for (const result of results) {
    newInput.push({
      type: 'function_call_output',
      call_id: result.id,
      output: result.output,
    });
  }

  return newInput;
}

// OpenAI agentic completion with tool loop
async function openaiAgenticComplete(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContext: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  message: string,
  userId: string,
  supabase: SupabaseClientAny,
  reasoningEffort: OpenAIReasoningEffort = 'medium',
  maxIterations: number = AGENTIC_MAX_ITERATIONS
): Promise<ExtendedAIResponse & { healthToolCalls?: ToolCallResult[] }> {
  const instructions = `${systemPrompt}\n\n${userContext}`;
  const tools = toOpenAITools(true); // Include web search

  // Build initial input
  let input: unknown[] = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const allToolCalls: ToolCallResult[] = [];
  let iteration = 0;
  let lastResponse: Record<string, unknown> | null = null;
  let totalTokens: TokenUsage = { prompt: 0, completion: 0, total: 0 };

  while (iteration < maxIterations) {
    iteration++;

    const requestBody: Record<string, unknown> = {
      model,
      input,
      instructions,
      max_output_tokens: 16000,
      tools,
      reasoning: {
        effort: reasoningEffort,
        summary: 'auto',
      },
    };

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
    lastResponse = data;

    // Accumulate token usage
    totalTokens.prompt += data.usage?.input_tokens || 0;
    totalTokens.completion += data.usage?.output_tokens || 0;
    totalTokens.total += data.usage?.total_tokens || 0;

    // Check for function calls
    const pendingCalls = extractOpenAIPendingToolCalls(data.output);

    // Filter to only our health tools (not web_search)
    const healthToolCalls = pendingCalls.filter((c) =>
      ['search_events', 'get_biomarker_history', 'get_profile', 'get_recent_labs', 'get_medications', 'get_event_details'].includes(c.name)
    );

    if (healthToolCalls.length === 0) {
      // No more tool calls - we have the final response
      break;
    }

    // Execute each tool call
    const results: Array<{ id: string; output: string }> = [];

    for (const call of healthToolCalls) {
      const result = await executeToolCall(call.name, call.arguments, userId, supabase);

      // Truncate result if too large
      let output = JSON.stringify(result.data);
      if (output.length > 8000) {
        output = output.substring(0, 8000) + '... (truncated)';
      }

      results.push({ id: call.id, output });

      allToolCalls.push({
        id: call.id,
        type: 'function',
        name: call.name,
        arguments: call.arguments,
        result: output,
        status: result.success ? 'completed' : 'failed',
      });
    }

    // Append tool results to input for next iteration
    input = appendOpenAIToolResults(
      input as Array<{ role: string; content: string }>,
      healthToolCalls,
      results
    );
  }

  if (!lastResponse) {
    throw new Error('No response from OpenAI');
  }

  // Extract final content
  const content = extractOpenAIOutputText(lastResponse.output as unknown[]);
  const reasoning = extractOpenAIReasoning(lastResponse);
  const webSearchResults = extractOpenAIWebSearch(lastResponse.output as unknown[]);

  return {
    content,
    tokensUsed: totalTokens,
    reasoning,
    toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
    webSearchResults,
    healthToolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
  };
}

// Extract pending function calls from Gemini response
function extractGeminiPendingToolCalls(data: Record<string, unknown>): PendingToolCall[] {
  const candidates = data.candidates as Array<{
    content?: {
      parts?: Array<{
        functionCall?: { name: string; args?: Record<string, unknown> };
      }>;
    };
  }>;

  if (!candidates?.[0]?.content?.parts) return [];

  const pending: PendingToolCall[] = [];

  for (const part of candidates[0].content.parts) {
    if (part.functionCall) {
      pending.push({
        id: `gemini-call-${pending.length}`,
        name: part.functionCall.name,
        arguments: part.functionCall.args || {},
      });
    }
  }

  return pending;
}

// Gemini agentic completion with tool loop
async function geminiAgenticComplete(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContext: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  message: string,
  userId: string,
  supabase: SupabaseClientAny,
  thinkingLevel: GeminiThinkingLevel = 'high',
  maxIterations: number = AGENTIC_MAX_ITERATIONS
): Promise<ExtendedAIResponse & { healthToolCalls?: ToolCallResult[] }> {
  const systemInstruction = `${systemPrompt}\n\n${userContext}`;
  const tools = toGeminiTools(true); // Include Google search

  // Build initial contents
  let contents: Array<{ role: string; parts: Array<unknown> }> = [
    ...history.map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const allToolCalls: ToolCallResult[] = [];
  let iteration = 0;
  let lastResponse: Record<string, unknown> | null = null;
  let totalTokens: TokenUsage = { prompt: 0, completion: 0, total: 0 };

  while (iteration < maxIterations) {
    iteration++;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            maxOutputTokens: 16000,
            thinkingConfig: { thinkingLevel },
          },
          tools,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Gemini request failed: ${response.status}`);
    }

    const data = await response.json();
    lastResponse = data;

    // Accumulate token usage
    totalTokens.prompt += data.usageMetadata?.promptTokenCount || 0;
    totalTokens.completion += data.usageMetadata?.candidatesTokenCount || 0;
    totalTokens.total += data.usageMetadata?.totalTokenCount || 0;

    // Check for function calls
    const pendingCalls = extractGeminiPendingToolCalls(data);

    // Filter to only our health tools
    const healthToolCalls = pendingCalls.filter((c) =>
      ['search_events', 'get_biomarker_history', 'get_profile', 'get_recent_labs', 'get_medications', 'get_event_details'].includes(c.name)
    );

    if (healthToolCalls.length === 0) {
      // No more tool calls - we have the final response
      break;
    }

    // Add model's function call to contents
    const modelParts: Array<unknown> = [];
    for (const call of healthToolCalls) {
      modelParts.push({
        functionCall: { name: call.name, args: call.arguments },
      });
    }
    contents.push({ role: 'model', parts: modelParts });

    // Execute each tool call and build function responses
    const functionResponseParts: Array<unknown> = [];

    for (const call of healthToolCalls) {
      const result = await executeToolCall(call.name, call.arguments, userId, supabase);

      // Truncate result if too large
      let output = result.data;
      const outputStr = JSON.stringify(output);
      if (outputStr.length > 8000) {
        output = { truncated: true, message: 'Result too large', preview: outputStr.substring(0, 1000) };
      }

      functionResponseParts.push({
        functionResponse: {
          name: call.name,
          response: output,
        },
      });

      allToolCalls.push({
        id: call.id,
        type: 'function',
        name: call.name,
        arguments: call.arguments,
        result: JSON.stringify(output),
        status: result.success ? 'completed' : 'failed',
      });
    }

    // Add function responses to contents
    contents.push({ role: 'user', parts: functionResponseParts });
  }

  if (!lastResponse) {
    throw new Error('No response from Gemini');
  }

  // Extract final content
  const content = extractGeminiContent(lastResponse);
  const reasoning = extractGeminiThinking(lastResponse);
  const groundingResult = extractGeminiGrounding(lastResponse);

  return {
    content,
    tokensUsed: totalTokens,
    reasoning,
    toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
    webSearchResults: groundingResult?.sources,
    citations: groundingResult?.citations,
    healthToolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
  };
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
  thinkingLevel: GeminiThinkingLevel = 'high'
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
          maxOutputTokens: 16000,
          thinkingConfig: { thinkingLevel },
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
    tokensUsed: {
      prompt: data.usageMetadata?.promptTokenCount || 0,
      completion: data.usageMetadata?.candidatesTokenCount || 0,
      total: data.usageMetadata?.totalTokenCount || 0,
    },
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

// Get allowed origin for CORS (localhost for dev, production URL for deployed)
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
  return allowedOrigins[0]; // Default to production URL
}

async function handler(req: LoggedRequest, res: VercelResponse) {
  const log = req.log.child('Chat');

  // CORS headers - restrict to allowed origins
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
    // === TIMING DEBUG ===
    const timings: Record<string, number> = {};
    const t_start = Date.now();

    const supabase = createSupabaseClient(authHeader);
    const userId = await getUserId(supabase, authHeader);
    timings.auth = Date.now() - t_start;

    // Get request body
    const { message, history = [], conversationId } = req.body as {
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      conversationId?: string;
    };

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user's AI settings (global defaults)
    const t_settings = Date.now();
    const { data: globalSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('ai_provider, ai_model, openai_reasoning_effort, gemini_thinking_level')
      .eq('user_id', userId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    // If conversationId provided, fetch conversation-specific settings
    let conversationSettings: {
      provider: string | null;
      model: string | null;
      reasoning_effort: string | null;
      thinking_level: string | null;
    } | null = null;

    if (conversationId) {
      const { data: convData } = await supabase
        .from('ai_conversations')
        .select('provider, model, reasoning_effort, thinking_level')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (convData?.provider) {
        conversationSettings = convData;
      }
    }
    timings.settings = Date.now() - t_settings;

    // Use conversation settings if available, otherwise fall back to global
    const provider = (conversationSettings?.provider || globalSettings?.ai_provider) as 'openai' | 'google' | null;
    const model = conversationSettings?.model || globalSettings?.ai_model;
    const reasoningEffort = (conversationSettings?.reasoning_effort || globalSettings?.openai_reasoning_effort || 'medium') as OpenAIReasoningEffort;
    const thinkingLevel = (conversationSettings?.thinking_level || globalSettings?.gemini_thinking_level || 'high') as GeminiThinkingLevel;

    if (!provider) {
      return res.status(400).json({
        error: 'AI not configured. Please select a provider in Settings.',
      });
    }

    // Use server-side API keys
    const apiKey = provider === 'openai' ? OPENAI_API_KEY : GOOGLE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: `Server API key not configured for ${provider === 'openai' ? 'OpenAI' : 'Google'}.`,
      });
    }

    // Fetch minimal profile for agentic context (just name, age, gender)
    const t_profile = Date.now();
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('display_name, gender, date_of_birth')
      .eq('user_id', userId)
      .single();
    timings.profile = Date.now() - t_profile;

    // Build minimal user context for agentic mode
    let minimalContext = 'User profile not available.';
    if (userProfile) {
      const profile = userProfile as { display_name: string | null; gender: string; date_of_birth: string };
      let age: number | null = null;
      if (profile.date_of_birth) {
        const today = new Date();
        const birthDate = new Date(profile.date_of_birth);
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }
      const parts = [];
      if (profile.display_name) parts.push(`Name: ${profile.display_name}`);
      if (age !== null) parts.push(`Age: ${age} years old`);
      if (profile.gender) parts.push(`Gender: ${profile.gender}`);
      minimalContext = parts.length > 0 ? `User: ${parts.join(', ')}` : 'User profile available via get_profile tool.';
    }

    // Call AI provider and track elapsed time
    const effectiveModel = model || (provider === 'openai' ? 'gpt-5.1' : 'gemini-3-pro-preview');

    const t_ai = Date.now();
    let result: ExtendedAIResponse & { healthToolCalls?: ToolCallResult[] };
    let usedFallback = false;

    // Try agentic approach first, fall back to one-shot on error
    try {
      log.info('Using agentic approach with tool-based retrieval');
      timings.mode = 'agentic';

      if (provider === 'openai') {
        result = await openaiAgenticComplete(
          apiKey,
          effectiveModel,
          AGENTIC_SYSTEM_PROMPT,
          minimalContext,
          history,
          message,
          userId,
          supabase,
          reasoningEffort
        );
      } else {
        result = await geminiAgenticComplete(
          apiKey,
          effectiveModel,
          AGENTIC_SYSTEM_PROMPT,
          minimalContext,
          history,
          message,
          userId,
          supabase,
          thinkingLevel
        );
      }
    } catch (agenticError) {
      // Fall back to one-shot approach
      log.warn('Agentic approach failed, falling back to one-shot', agenticError);
      usedFallback = true;
      timings.mode = 'fallback';

      // Fetch all data for one-shot fallback
      const t_events = Date.now();
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(100);
      timings.fallbackEvents = Date.now() - t_events;

      if (eventsError) {
        throw eventsError;
      }

      // Fetch full profile for fallback
      const { data: fullProfile } = await supabase
        .from('user_profiles')
        .select('display_name, gender, date_of_birth, height_cm, weight_kg, medical_conditions, current_medications, allergies, surgical_history, family_history, smoking_status, alcohol_frequency, exercise_frequency')
        .eq('user_id', userId)
        .single();

      // Build full context
      const profileContext = formatUserProfileForContext(fullProfile as UserProfileRow | null);
      const context = formatEventsForContext(events || []);
      const eventCount = events?.length || 0;
      const truncated = eventCount >= 100;
      const contextHeader = `The following is the user's health timeline (${eventCount} events${truncated ? ', showing most recent 100' : ''}):\n\n`;

      const messages: ProviderMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: profileContext },
        { role: 'system', content: contextHeader + context },
        ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
        { role: 'user', content: message },
      ];

      if (provider === 'openai') {
        result = await openaiComplete(apiKey, effectiveModel, messages, reasoningEffort);
      } else {
        result = await geminiComplete(apiKey, effectiveModel, messages, thinkingLevel);
      }
    }

    timings.aiProvider = Date.now() - t_ai;
    const elapsedMs = Date.now() - t_ai;
    const elapsedTime = formatElapsedTime(elapsedMs);

    timings.total = Date.now() - t_start;

    return res.status(200).json({
      content: result.content,
      tokensUsed: result.tokensUsed,
      sources: [], // Agentic mode doesn't use source extraction (tools provide data)
      reasoning: result.reasoning,
      toolCalls: result.toolCalls,
      webSearchResults: result.webSearchResults,
      citations: result.citations,
      elapsedTime,
      // Message metadata for details modal
      metadata: {
        model: effectiveModel,
        provider,
        tokensUsed: result.tokensUsed,
        reasoningEffort: provider === 'openai' ? reasoningEffort : undefined,
        thinkingLevel: provider === 'google' ? thinkingLevel : undefined,
        elapsedMs,
        agenticMode: !usedFallback,
        toolCallCount: result.healthToolCalls?.length || 0,
      },
      _timings: timings, // Include in response for frontend debugging
    });
  } catch (error) {
    log.error('Chat request failed', error);

    if (error instanceof Error) {
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

export default withLogger(handler);
