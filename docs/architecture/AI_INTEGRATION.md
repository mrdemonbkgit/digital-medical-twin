# AI Integration

> Last Updated: 2025-11-26

## Summary

Architecture for the AI Historian feature. Covers RAG implementation, AI provider integration, prompt engineering, and API configuration.

## Keywords

`AI` `RAG` `GPT` `Gemini` `historian` `chat` `integration` `API` `prompts`

## Table of Contents

- [RAG Architecture](#rag-architecture)
- [Supported Models](#supported-models)
- [API Configuration](#api-configuration)
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

### Google Gemini 3 Pro

| Property | Value |
|----------|-------|
| Model ID | gemini-3-pro |
| Context Window | TBD |
| Best For | Large context, summarization |
| API Base | https://generativelanguage.googleapis.com/v1 |

---

## API Configuration

### User Settings

Users provide their own API keys (stored encrypted):

```typescript
interface AISettings {
  provider: 'openai' | 'google';
  model: string;
  apiKey: string;                // Encrypted at rest
  temperature?: number;          // Default: 0.7
  maxTokens?: number;            // Default: 2000
}
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
