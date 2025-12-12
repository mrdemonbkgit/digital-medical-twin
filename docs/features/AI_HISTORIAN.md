# AI Historian Feature

> Last Updated: 2025-12-03

## Summary

The AI Historian is a RAG-powered chat interface that answers questions about the user's health history. Users can query trends, find correlations, and generate summaries using their choice of GPT-5.2 or Gemini 3 Pro. Features include persistent conversation history, activity timeline (ChatGPT-style), web search grounding with inline citations, and multi-provider API key management.

## Keywords

`AI` `historian` `chat` `RAG` `queries` `analysis` `GPT` `Gemini` `questions` `reasoning_effort` `thinking_level` `conversations` `history` `agentic` `one-shot` `streaming`

## Table of Contents

- [Feature Overview](#feature-overview)
- [Chat History](#chat-history)
- [Chat Interface](#chat-interface)
- [Agentic vs One-Shot Mode](#agentic-vs-one-shot-mode)
- [Query Types](#query-types)
- [Example Queries](#example-queries)
- [Configuration](#configuration)
- [Limitations](#limitations)

---

## Feature Overview

The AI Historian transforms raw health data into actionable insights. Unlike generic chatbots, it has access to the user's complete health timeline and can answer specific questions about their medical history.

### User Stories

- As a user, I can ask questions about my health history in natural language
- As a user, I can find correlations between interventions and outcomes
- As a user, I can generate summaries for doctor appointments
- As a user, I can choose which AI model to use
- As a user, I can see what data the AI used to answer
- As a user, I can view and continue past conversations
- As a user, I can rename and delete old conversations

---

## Chat History

Conversations are automatically saved and can be accessed from the sidebar.

### Features

- **Auto-save**: Messages are saved automatically as you chat
- **Conversation list**: ChatGPT-style sidebar showing all past conversations
- **Continue anytime**: Click any conversation to continue where you left off
- **Auto-title**: Conversations are titled from the first message
- **Rename**: Edit conversation titles inline
- **Delete**: Remove conversations you no longer need
- **URL sharing**: Each conversation has a unique URL (`/ai?c=<id>`)

### Layout

```
┌──────────────────────────────────────────────────────┐
│ [≡] AI Historian                    [Reasoning] [+]  │
├────────────┬─────────────────────────────────────────┤
│ + New Chat │                                         │
│ ─────────  │         Chat Messages Area              │
│ ▸ Chat 1   │                                         │
│   Chat 2   │  [Messages displayed here]              │
│   Chat 3   │                                         │
│            ├─────────────────────────────────────────┤
│            │ Ask about your health history...  [↵]   │
└────────────┴─────────────────────────────────────────┘
```

### Database Schema

| Table | Purpose |
|-------|---------|
| `ai_conversations` | Conversation metadata (title, timestamps) |
| `ai_messages` | Individual messages with metadata |

Messages store rich metadata in JSONB including sources, reasoning traces, tool calls, web search results, and inline citations.

---

## Chat Interface

### Layout

```
┌─────────────────────────────────────────┐
│  AI Historian              [Settings]   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 Compare my vitamin D levels   │   │
│  │    over the past 2 years         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🤖 Based on your lab results:   │   │
│  │                                  │   │
│  │ | Date       | Vitamin D |      │   │
│  │ |------------|-----------|      │   │
│  │ | 2024-03-15 | 28 ng/mL  | Low  │   │
│  │ | 2023-09-10 | 45 ng/mL  | OK   │   │
│  │ | 2023-03-20 | 22 ng/mL  | Low  │   │
│  │                                  │   │
│  │ Your vitamin D has fluctuated... │   │
│  │                                  │   │
│  │ [Sources: 3 lab results]        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Ask about your health history...│   │
│  │                          [Send] │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Message Components

**User Message:**
- User avatar/icon
- Message text
- Timestamp

**AI Response:**
- AI avatar/icon
- Formatted response (supports markdown tables, lists)
- Inline citations with superscript markers (Wikipedia-style `[1,2]`)
- Activity timeline showing reasoning, tool calls, and web searches
- Source indicator showing which events were used
- Timestamp

---

## Agentic vs One-Shot Mode

The AI Historian supports two modes for retrieving health data:

### Agentic Mode (Default for OpenAI)

AI uses tools to retrieve data on-demand as it processes your question.

**How it works:**
1. AI receives your question with minimal context (just profile info)
2. AI calls tools like `search_events`, `get_medications`, `get_biomarker_history`
3. Real-time feedback shows which tools are running
4. AI synthesizes data from multiple tool calls into a response

**Benefits:**
- More focused retrieval — only fetches relevant data
- Reduced context size — faster initial processing
- Visible reasoning — see what data the AI accessed

**Limitations:**
- Not available for Gemini (API limitation)
- May require multiple tool calls for complex queries

### One-Shot Mode (Default for Gemini)

All health data is provided upfront in the initial context.

**How it works:**
1. AI receives your question with full health context
2. AI processes everything in a single request
3. Response generated from pre-loaded data

**Benefits:**
- Works with Gemini (no function calling required)
- Single request — no back-and-forth
- May be faster for simple queries

**Limitations:**
- Larger context size — more tokens used
- May hit context limits with extensive history

### Switching Modes

| Location | Scope | When Editable |
|----------|-------|---------------|
| Settings page | Global default | Always |
| Chat header | Per-conversation | Before first message |

**Notes:**
- Mode locks after first message (prevents mid-conversation context changes)
- Gemini always uses One-Shot mode (toggle disabled)
- Chat header shows current mode ("Agentic" or "One-Shot")

### Streaming Feedback

During agentic mode processing, the UI shows real-time tool execution:

```
┌─────────────────────────────────────────────────┐
│ 🔄 Checking medications... (3 tools used)       │
└─────────────────────────────────────────────────┘
```

Tool labels:
- "Loading your profile..."
- "Checking medications..."
- "Retrieving lab results..."
- "Analyzing biomarker trends..."
- "Searching health timeline..."
- "Getting event details..."

---

## Query Types

### Trend Analysis

Ask about changes over time.

**Triggers:** "over time", "trend", "history of", "changes in"

**Data Retrieved:** Time-series of relevant biomarkers/metrics

### Comparison

Compare different time periods or interventions.

**Triggers:** "compare", "before and after", "vs", "difference between"

**Data Retrieved:** Events from multiple specified periods

### Correlation

Find relationships between events.

**Triggers:** "related to", "affect", "when I", "did X change Y"

**Data Retrieved:** Events of multiple types around specified dates

### Summarization

Generate summaries or reports.

**Triggers:** "summarize", "overview", "prepare for", "list all"

**Data Retrieved:** Broad selection of relevant events

### Specific Lookup

Find specific information.

**Triggers:** Names, dates, specific tests, medications

**Data Retrieved:** Targeted events matching criteria

---

## Example Queries

### Trend Analysis

```
"Show me my LDL cholesterol trend over the past 3 years"
"How has my HRV changed since I started exercising?"
"What's the history of my thyroid levels?"
```

### Comparison

```
"Compare my sleep scores before and after starting magnesium"
"What were my energy levels in summer vs winter?"
"Compare my bloodwork from 2023 to 2024"
```

### Correlation

```
"I felt tired in November 2023. What were my iron levels then?"
"Did my blood pressure change after starting meditation?"
"What was happening when my HRV dropped in March?"
```

### Summarization

```
"Summarize my cardiology visits with Dr. Smith"
"Prepare a health summary for a new doctor"
"List all medications I've taken for blood pressure"
```

### Specific Lookup

```
"When did I start taking metformin?"
"What was my last HbA1c result?"
"Show me notes from my endocrinologist visit in January"
```

---

## Configuration

### Settings Panel

| Setting | Options | Default |
|---------|---------|---------|
| AI Provider | OpenAI, Google | None |
| Model | GPT-5.2 (OpenAI), Gemini 3 Pro (Google) | Auto-selected by provider |
| Reasoning Effort (OpenAI) | None, Minimal, Low, Medium, High | Medium |
| Thinking Level (Google) | Low, High | High |
| Agentic Mode | On, Off | On (OpenAI), Off (Gemini) |

### How It Works

- **Server-side API keys**: The application uses centrally-managed API keys. Users do not need to provide their own keys.
- **Provider selection**: Choose between OpenAI GPT-5.2 or Google Gemini 3 Pro
- **Reasoning configuration**: Adjust how deeply the AI thinks before responding
  - **OpenAI Reasoning Effort**: Controls thinking tokens (higher = more thorough but slower)
  - **Gemini Thinking Level**: Controls thinking depth (high recommended for complex queries)

---

## Limitations

### What AI Can Do

- Answer questions using data in the timeline
- Identify patterns and trends
- Generate tables and summaries
- Provide context for conversations with doctors

### What AI Cannot Do

- Provide medical advice or diagnoses
- Access data not in the timeline
- Search across conversation history
- Guarantee 100% accuracy

### Disclaimer

Every AI response should include or be accompanied by:

> "This is not medical advice. Always consult with healthcare professionals for medical decisions."

---

## Related Documents

- /docs/architecture/AI_INTEGRATION.md — Technical implementation
- /docs/features/DATA_TRACKING.md — Event types the AI can access
- /docs/development/API_CONTRACTS.md — AI API endpoints
