# System Overview

> Last Updated: 2025-11-26

## Summary

High-level architecture of Digital Medical Twin. Describes the major components, data flow, and system boundaries. Read this to understand how the application is structured.

## Keywords

`architecture` `system` `overview` `components` `data flow` `structure`

## Table of Contents

- [Architecture Diagram](#architecture-diagram)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [External Integrations](#external-integrations)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Pages      │  │  Components  │  │   Context/State      │  │
│  │  - Timeline  │  │  - EventCard │  │  - AuthContext       │  │
│  │  - Login     │  │  - EventForm │  │  - EventsContext     │  │
│  │  - Chat      │  │  - AIChat    │  │  - AIContext         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    │     API Layer     │                        │
│                    │  - events.ts      │                        │
│                    │  - auth.ts        │                        │
│                    │  - ai.ts          │                        │
│                    └─────────┬─────────┘                        │
└──────────────────────────────┼──────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
   │  Cloud DB     │   │   Auth        │   │   AI APIs     │
   │  (Events,     │   │   Service     │   │  - GPT-5.1    │
   │   Users)      │   │               │   │  - Gemini 3   │
   └───────────────┘   └───────────────┘   └───────────────┘
```

---

## Core Components

### Pages

| Page | Purpose |
|------|---------|
| Timeline | Main view displaying chronological health events |
| Login | User authentication (username/password) |
| Chat | AI Historian interface for querying health history |
| Settings | User preferences, API key configuration |

### Component Categories

| Category | Purpose |
|----------|---------|
| Event Components | Display and edit health events (cards, forms, filters) |
| Timeline Components | Timeline layout, scrolling, date navigation |
| AI Components | Chat interface, message display, query input |
| Common Components | Buttons, inputs, modals, navigation |

### State Management

| Context | Purpose |
|---------|---------|
| AuthContext | User session, login state, credentials |
| EventsContext | Health events data, CRUD operations |
| AIContext | AI configuration, chat history, model selection |

---

## Data Flow

### Event Creation Flow

```
User Input → EventForm → EventsContext → API Layer → Cloud DB
                                              ↓
                              EventsContext (update) ← Response
                                              ↓
                                      Timeline (re-render)
```

### AI Query Flow

```
User Question → AIChat → AIContext → API Layer
                                         ↓
                              Retrieve relevant events
                                         ↓
                              Build RAG prompt
                                         ↓
                              AI API (GPT-5.1 / Gemini 3)
                                         ↓
                              Response → AIChat (display)
```

---

## External Integrations

| Service | Purpose | Auth Method |
|---------|---------|-------------|
| Cloud Database | Event storage, user data | Service credentials |
| OpenAI API | GPT-5.1 for AI Historian | User API key |
| Google AI API | Gemini 3 Pro for AI Historian | User API key |

---

## Related Documents

- /docs/architecture/DATABASE_SCHEMA.md — Data models
- /docs/architecture/AUTH_SYSTEM.md — Authentication details
- /docs/architecture/AI_INTEGRATION.md — AI system architecture
