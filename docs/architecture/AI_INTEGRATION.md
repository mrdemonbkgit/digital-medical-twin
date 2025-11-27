# AI Integration

> Last Updated: 2025-11-27

## Summary

Architecture for the AI Historian feature. Covers RAG implementation, AI provider integration, prompt engineering, API configuration, activity timeline, and Gemini grounding with inline citations.

## Keywords

`AI` `RAG` `GPT` `Gemini` `historian` `chat` `integration` `API` `prompts` `grounding` `citations`

## Table of Contents

- [RAG Architecture](#rag-architecture)
- [Supported Models](#supported-models)
- [API Configuration](#api-configuration)
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
│  5. Send to AI Provider ───────▶ GPT-5.1 / Gemini 3         │
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

### OpenAI GPT-5.1

| Property | Value |
|----------|-------|
| Model ID | gpt-5.1 |
| Context Window | TBD |
| Best For | Complex reasoning, analysis |
| API Base | https://api.openai.com/v1 |

### Google Gemini Models

| Model | Model ID | Best For |
|-------|----------|----------|
| Gemini 3 Pro (Preview) | gemini-3-pro-preview | Large context, web grounding, citations |
| Gemini 2.5 Flash | gemini-2.5-flash | Fast responses, cost-effective |
| Gemini 2.5 Pro | gemini-2.5-pro | Complex reasoning, analysis |

API Base: `https://generativelanguage.googleapis.com/v1beta`

---

## API Configuration

### User Settings

Users provide their own API keys (stored encrypted per provider):

```typescript
interface AISettings {
  provider: 'openai' | 'google' | null;
  model: AIModel | null;
  temperature: number;           // Default: 0.7 (disabled for OpenAI)
  hasOpenAIKey: boolean;         // Whether OpenAI key is stored
  hasGoogleKey: boolean;         // Whether Google key is stored
}

// Database columns: encrypted_openai_key, encrypted_google_key
// Keys are encrypted using AES-256-GCM before storage
// Encryption performed server-side using ENCRYPTION_KEY env var (base64)
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
