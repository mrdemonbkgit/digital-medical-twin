# AI Integration

> Last Updated: 2025-12-03

## Summary

Architecture for the AI Historian feature. Covers RAG implementation, AI provider integration, prompt engineering, API configuration, activity timeline, and Gemini grounding with inline citations.

## Keywords

`AI` `RAG` `GPT` `Gemini` `historian` `chat` `integration` `API` `prompts` `grounding` `citations` `reasoning_effort` `thinking_level` `server-side API keys` `agentic` `SSE` `streaming` `tools`

## Table of Contents

- [RAG Architecture](#rag-architecture)
- [Supported Models](#supported-models)
- [API Configuration](#api-configuration)
- [Agentic Mode](#agentic-mode)
- [SSE Streaming](#sse-streaming)
- [Lab Result PDF Extraction](#lab-result-pdf-extraction)
- [Gemini Grounding & Citations](#gemini-grounding--citations)
- [Activity Timeline](#activity-timeline)
- [Prompt Engineering](#prompt-engineering)
- [Query Processing](#query-processing)

---

## RAG Architecture

Retrieval-Augmented Generation (RAG) enables the AI to answer questions using the user's actual health data.

```
┌─────────────────────────────────────────────────────────────┐
│                      Query Processing                        │
├─────────────────────────────────────────────────────────────┤
│  1. User Question                                            │
│       ↓                                                      │
│  2. Extract Keywords/Intent                                  │
│       ↓                                                      │
│  3. Retrieve Relevant Events ◀── Events Database            │
│       ↓                                                      │
│  4. Build Context Prompt                                     │
│       ↓                                                      │
│  5. Send to AI Provider ───────▶ GPT-5.2 / Gemini 3         │
│       ↓                                                      │
│  6. Return Response                                          │
└─────────────────────────────────────────────────────────────┘
```

### Retrieval Strategy

| Query Type | Retrieval Method |
|------------|------------------|
| Time-based ("last 3 years") | Filter by date range |
| Type-based ("all bloodwork") | Filter by event type |
| Entity-based ("Dr. Smith") | Text search on fields |
| Correlation ("before/after X") | Multiple date-range queries |
| General ("summarize history") | Recent events + sampling |

---

## Supported Models

### OpenAI GPT-5.2

| Property | Value |
|----------|-------|
| Model ID | `gpt-5.2` |
| Context Window | 400,000 tokens |
| Best For | Complex reasoning, analysis |
| API Base | https://api.openai.com/v1 |

**Reasoning Effort Parameter:** Controls how much thinking GPT-5.2 does before responding.

| Value | Description |
|-------|-------------|
| `none` | No reasoning tokens (fastest) |
| `minimal` | Very few reasoning tokens |
| `low` | Light reasoning for simpler tasks |
| `medium` | Balanced reasoning (default) |
| `high` | Deep reasoning, best intelligence |

### Google Gemini 3 Pro

| Property | Value |
|----------|-------|
| Model ID | `gemini-3-pro-preview` |
| Context Window | 1,000,000 tokens |
| Best For | Large context, web grounding, citations |
| API Base | https://generativelanguage.googleapis.com/v1beta |

**Thinking Level Parameter:** Controls the depth of Gemini's thinking process.

| Value | Description |
|-------|-------------|
| `low` | Light thinking |
| `high` | Deep thinking (default) |

> Note: Thinking cannot be disabled for Gemini 3 Pro (unlike Gemini 2.5).

---

## API Configuration

### Server-Side API Keys

The application uses server-side API keys configured as environment variables. Users do not need to provide their own keys.

**Environment Variables:**

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-5.2 |
| `GOOGLE_API_KEY` | Google AI API key for Gemini |

### User Settings

Users select their preferred provider and configure reasoning parameters:

```typescript
interface AISettings {
  provider: 'openai' | 'google' | null;
  model: AIModel | null;
  openaiReasoningEffort: 'none' | 'minimal' | 'low' | 'medium' | 'high';
  geminiThinkingLevel: 'low' | 'high';
  agenticMode: boolean;
}

// Database columns: ai_provider, ai_model, openai_reasoning_effort, gemini_thinking_level, agentic_mode
```

### Provider Adapter

Abstract interface for AI providers:

```typescript
interface AIProvider {
  name: string;
  sendMessage(
    messages: ChatMessage[],
    context: string,
    options: AIOptions
  ): Promise<AIResponse>;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  content: string;
  tokensUsed: number;
  model: string;
}
```

---

## Agentic Mode

Agentic mode enables tool-based data retrieval where the AI calls functions to fetch specific health data on-demand.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Agentic Mode Flow                         │
├─────────────────────────────────────────────────────────────┤
│  1. User Question + Minimal Context (profile only)          │
│       ↓                                                      │
│  2. AI decides which tools to call                          │
│       ↓                                                      │
│  3. Tool Execution Loop (max 10 iterations)                 │
│       ├─▶ search_events(query, type?, date_range?)          │
│       ├─▶ get_biomarker_history(name, limit?)               │
│       ├─▶ get_profile()                                     │
│       ├─▶ get_recent_labs(limit?)                           │
│       ├─▶ get_medications(active_only?)                     │
│       └─▶ get_event_details(event_id)                       │
│       ↓                                                      │
│  4. AI synthesizes tool results into response               │
│       ↓                                                      │
│  5. Stream response back to client                          │
└─────────────────────────────────────────────────────────────┘
```

### Tool Definitions

| Tool | Description |
|------|-------------|
| `search_events` | Full-text search across all health events |
| `get_biomarker_history` | Time series data for a specific biomarker |
| `get_profile` | User's basic health profile |
| `get_recent_labs` | Recent lab result summaries |
| `get_medications` | Current or historical medications |
| `get_event_details` | Full details of a specific event |

### One-Shot Fallback

When agentic mode is disabled or fails, the system falls back to one-shot mode:

1. Fetch all user events, profile, medications, and recent labs
2. Include everything in a single context string
3. Send to AI provider for processing

**Fallback triggers:**
- `agenticMode: false` in settings
- Provider is Gemini (API limitation)
- Tool execution error
- Max iterations exceeded

### Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `agentic_mode` | `true` | Enable tool-based retrieval |
| `AI_MAX_TOOL_ITERATIONS` | `10` | Max tool calls per request |

---

## SSE Streaming

Server-Sent Events (SSE) enable real-time feedback during AI processing.

### Event Types

```typescript
interface StreamEvent {
  type: 'tool_call_start' | 'tool_call_result' | 'content_chunk' | 'complete' | 'error';
  data: unknown;
}

// Tool call start
{ type: 'tool_call_start', data: { id: string, name: string, args?: object } }

// Tool call result
{ type: 'tool_call_result', data: { id: string, name: string, status: 'completed' | 'failed' } }

// Final response
{ type: 'complete', data: { content: string, sources: Source[], metadata: Metadata } }

// Error
{ type: 'error', data: { message: string } }
```

### Client Implementation

```typescript
// Read SSE stream
async function* readSSEStream(response: Response): AsyncGenerator<SSEEvent> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const eventStr of events) {
      const dataMatch = eventStr.match(/^data:\s*(.+)$/m);
      if (dataMatch) {
        yield JSON.parse(dataMatch[1]);
      }
    }
  }
}
```

### Streaming Status

The frontend tracks streaming status for UI feedback:

```typescript
interface StreamingStatus {
  active: boolean;
  currentTool: string | null;  // Currently executing tool
  toolCallCount: number;       // Total tools used
}
```

### SSE Headers

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

---

## Lab Result PDF Extraction

Two-stage AI pipeline for extracting data from lab result PDFs. Uses asynchronous processing via the Lab Uploads feature.

**See:** /docs/features/LAB_UPLOADS.md for user-facing details.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PDF Extraction Pipeline                   │
├─────────────────────────────────────────────────────────────┤
│  1. PDF Upload → Supabase Storage (lab-pdfs bucket)         │
│       ↓                                                      │
│  2. User clicks "Extract Data with AI"                       │
│       ↓                                                      │
│  3. Stage 1: Gemini 2.0 Flash                                │
│     - Receives PDF as base64                                 │
│     - Extracts all biomarkers, patient info, metadata        │
│     - Returns structured JSON                                │
│       ↓                                                      │
│  4. Stage 2: GPT-4o Verification                             │
│     - Receives PDF + Stage 1 output                          │
│     - Verifies extraction accuracy                           │
│     - Makes corrections if needed                            │
│     - Returns verified JSON + corrections list               │
│       ↓                                                      │
│  5. Form auto-populated with extracted data                  │
└─────────────────────────────────────────────────────────────┘
```

### Stage 1: Gemini Extraction

| Property | Value |
|----------|-------|
| Model | `gemini-3-pro-preview` |
| Temperature | 0.1 |
| Max Output Tokens | 64000 |
| Thinking Level | `high` |
| Input | PDF as inline base64 |

**Extracted Fields:**
- Patient name, gender, birthday
- Lab name, ordering doctor, test date
- All biomarkers with values, units, reference ranges, flags

### Stage 2: GPT Verification

| Property | Value |
|----------|-------|
| Model | `gpt-5.2` |
| Reasoning Effort | `high` |
| Max Output Tokens | 16000 |
| Input | PDF image + Stage 1 JSON |

**Verification Tasks:**
- Verify patient information matches PDF
- Check each biomarker value, unit, and range
- Correct any extraction errors
- Determine if values are high/low/normal
- Return list of corrections made

### API Endpoint

```
POST /api/ai/extract-lab-results
Authorization: Bearer <supabase_token>
Content-Type: application/json

{
  "storagePath": "user-id/filename.pdf"
}
```

### Response Format

```typescript
interface ExtractionResult {
  success: boolean;
  clientName?: string;
  clientGender?: 'male' | 'female' | 'other';
  clientBirthday?: string;
  labName?: string;
  orderingDoctor?: string;
  testDate?: string;
  biomarkers: Biomarker[];
  extractionConfidence: number;  // 0.7-0.95
  verificationPassed: boolean;   // Backwards compatibility (true if clean or corrected)
  verificationStatus: 'clean' | 'corrected' | 'failed';  // Detailed verification result
  corrections?: string[];  // List of corrections made
  error?: string;
}
```

**Verification Status Values:**

| Status | Description |
|--------|-------------|
| `clean` | Extraction verified without corrections |
| `corrected` | Extraction verified, corrections were applied |
| `failed` | Verification failed (timeout, API error, etc.) |

Note: `verificationPassed` is `true` when status is `clean` or `corrected`, `false` when `failed`.

### Storage

PDFs are stored in Supabase Storage with RLS policies:

| Policy | Rule |
|--------|------|
| Upload | User can only upload to their own folder |
| Read | User can only read their own files |
| Delete | User can only delete their own files |

---

## Gemini Grounding & Citations

Gemini 3 Pro supports web search grounding, providing source attribution for responses.

### Grounding Metadata Structure

```typescript
// Response from Gemini API
{
  candidates: [{
    groundingMetadata: {
      // Sources found during search
      groundingChunks: [
        { web: { uri: string, title: string } }
      ],

      // Maps response segments to sources (for inline citations)
      groundingSupports: [
        {
          segment: {
            startIndex: number,
            endIndex: number,
            text: string
          },
          groundingChunkIndices: number[],
          confidenceScores: number[]
        }
      ],

      webSearchQueries: string[]  // What was searched
    }
  }]
}
```

### Inline Citations

Citations are rendered as Wikipedia-style superscript markers:

- `[1]`, `[2,3]` appear after cited text
- Hovering shows source titles
- Clicking scrolls to sources section
- Numbers correspond to numbered sources in activity panel

### Types

```typescript
interface InlineCitation {
  startIndex: number;
  endIndex: number;
  text: string;
  sourceIndices: number[];  // References to sources array
  confidence: number;
}

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  displayUrl?: string;
}
```

---

## Activity Timeline

ChatGPT-style collapsible panel showing AI reasoning process.

### Activity Types

| Type | Icon | Description |
|------|------|-------------|
| thinking | Brain | Reasoning steps from model |
| web_search | Globe | Web searches with sources |
| tool_call | Wrench | Function calls |

### Components

- `ActivityPanel` - Collapsible container with elapsed time
- `ThinkingStep` - Expandable reasoning step
- `WebSearchStep` - Numbered sources with favicons
- `ToolCallStep` - Function call details

### Message Metadata

```typescript
interface ChatMessage {
  // ... base fields
  reasoning?: ReasoningTrace;      // Thinking steps
  toolCalls?: ToolCall[];          // Function calls
  webSearchResults?: WebSearchResult[];  // Sources
  citations?: InlineCitation[];    // Inline citation mappings
  elapsedTime?: string;            // "3m 0s" format
}
```

---

## Prompt Engineering

### System Prompt Template

```
You are a personal health historian assistant. You have access to the user's
health timeline containing medical events, lab results, medications, and
lifestyle interventions.

Your role is to:
- Answer questions about the user's health history accurately
- Identify trends and correlations when asked
- Summarize complex medical information clearly
- Never make up information not present in the data
- Clearly state when data is insufficient to answer

The user's health data is provided below as context.
```

### Context Format

```
=== HEALTH TIMELINE CONTEXT ===

[LAB RESULT] 2024-03-15: Annual Bloodwork
- LDL Cholesterol: 95 mg/dL (normal)
- HbA1c: 5.4% (normal)
- Vitamin D: 28 ng/mL (low)
Notes: Ordered by Dr. Smith

[MEDICATION] Started 2024-03-20: Vitamin D3
- Dosage: 5000 IU daily
- Reason: Low vitamin D levels

[DOCTOR VISIT] 2024-06-01: Cardiology Follow-up
- Doctor: Dr. Johnson (Cardiology)
- Notes: Heart function normal, continue current medications

=== END CONTEXT ===
```

---

## Query Processing

### Intent Detection

| Intent | Keywords | Action |
|--------|----------|--------|
| Trend | "over time", "trend", "change" | Retrieve time series |
| Comparison | "compare", "before/after", "vs" | Multi-period retrieval |
| Summary | "summarize", "overview", "all" | Broad retrieval |
| Specific | Names, dates, specific tests | Targeted retrieval |
| Correlation | "related to", "when", "affect" | Cross-type retrieval |

### Token Management

- Reserve tokens for system prompt: ~500
- Reserve tokens for response: ~2000
- Remaining budget for context: varies by model
- Prioritize recent and relevant events when context is limited

---

## Related Documents

- /docs/features/AI_HISTORIAN.md — User-facing feature details
- /docs/development/API_CONTRACTS.md — AI API endpoints
