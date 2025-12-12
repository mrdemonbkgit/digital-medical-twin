# Onboarding

> Last Updated: 2025-11-29

## Summary

Project setup, tech stack, and directory structure. Read this first when starting a new session.

## Keywords

`setup` `install` `structure` `tech stack` `getting started` `directory` `project` `dev server` `WSL2` `vercel dev` `express` `hot reload`

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Setup Instructions](#setup-instructions)
- [Available Scripts](#available-scripts)
- [Local API Development](#local-api-development)

---

## Project Overview

Digital Medical Twin is a **personal health tracking application** designed for individual users to maintain a comprehensive digital twin of their own medical history. Each user tracks their own health data - the app is not designed for managing multiple patients or family members within a single account.

Users log health events (bloodwork, doctor visits, medications, interventions, metrics) and query their history using AI (GPT-5.2 or Gemini 3 Pro). Data is stored in the cloud with username/password authentication.

### Design Assumptions

- **Single-user focus**: Each account represents one person tracking their own health
- **No patient info on lab results**: When uploading lab PDFs, patient name/gender/birthday are extracted but not stored or displayed (the user is the patient)
- **User profile as source of truth**: Gender for reference ranges comes from the user's profile, not lab documents

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Icons | Lucide React | latest |
| Build | Vite | latest |
| Database | Supabase (PostgreSQL) | latest |
| Auth | Supabase Auth | latest |
| Hosting | Vercel | latest |
| AI | OpenAI GPT-5.2 / Google Gemini 3 Pro | latest |
| AI Proxy | Vercel Serverless Functions | latest |

---

## Directory Structure

```
/digital-medical-twin
│
├── CLAUDE.md                 # Claude Code context
├── AGENTS.md                 # Codex CLI context
│
├── /.cursor/rules/           # Cursor IDE rules
│   ├── project-context.mdc
│   ├── react-components.mdc
│   ├── api-layer.mdc
│   └── documentation.mdc
│
├── /docs/                    # Documentation
│   ├── INDEX.md              # Master search index
│   ├── ONBOARDING.md         # This file
│   ├── AGENT_PROTOCOL.md     # Agent workflow rules
│   ├── DECISION_LOG.md       # Architectural decisions
│   ├── CHANGELOG.md          # Version history
│   │
│   ├── /architecture/        # System design docs
│   │   ├── SYSTEM_OVERVIEW.md
│   │   ├── DATABASE_SCHEMA.md
│   │   ├── AUTH_SYSTEM.md
│   │   └── AI_INTEGRATION.md
│   │
│   ├── /features/            # Feature documentation
│   │   ├── TIMELINE.md
│   │   ├── DATA_TRACKING.md
│   │   └── AI_HISTORIAN.md
│   │
│   └── /development/         # Development standards
│       ├── CODING_STANDARDS.md
│       ├── COMPONENT_LIBRARY.md
│       ├── STATE_MANAGEMENT.md
│       ├── API_CONTRACTS.md
│       └── TESTING_STRATEGY.md
│
├── /src/                     # Source code
│   ├── /components/          # React components
│   ├── /pages/               # Page components
│   ├── /hooks/               # Custom hooks
│   ├── /context/             # React context providers
│   ├── /api/                 # API layer (frontend)
│   ├── /types/               # TypeScript types
│   ├── /utils/               # Utility functions
│   └── /styles/              # Global styles
│
├── /api/                     # API source (TypeScript) - Vercel serverless functions
│   ├── /ai/                  # AI endpoints (chat, lab extraction)
│   ├── /settings/            # Settings endpoints
│   └── /lib/                 # Shared API utilities (logger, PDF splitter, etc.)
│
├── /api-compiled/            # Compiled API output for local dev (gitignored)
│
├── /dev-server/              # Local development server
│   └── server.ts             # Express server with hot reload
│
├── /public/                  # Static assets
└── /tests/                   # Test files
```

---

## Setup Instructions

```bash
# Clone repository
git clone [repo-url]
cd digital-medical-twin

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run dev:api` | Start Express API server with hot reload (recommended for API work) |
| `npm run dev:vercel` | Start Vercel dev server (slower, production-accurate) |
| `npm run build:api` | Compile API TypeScript to JavaScript |
| `npm run build` | Production build |
| `npm run test` | Run test suite |
| `npm run lint` | Run linter |

---

## Local API Development

### Why Use the Express Dev Server?

The Vercel CLI (`vercel dev`) simulates AWS Lambda by spawning a **new Node.js process for each request**. On WSL2's 9p filesystem (`/mnt/c/...`), this causes ~32 second delays per API call due to slow cross-filesystem I/O.

The Express dev server bypasses this by running all handlers in a single persistent process with hot reload support.

### Performance Comparison

| Metric | `vercel dev` (WSL2) | `npm run dev:api` |
|--------|---------------------|-------------------|
| First request | ~32 seconds | ~100ms |
| Subsequent requests | ~32 seconds | ~1ms |
| Hot reload | N/A (always cold) | ~1-2 seconds |

### Usage

```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Start API server (recommended)
npm run dev:api
```

Vite proxies `/api/*` requests to the Express server on port 3001.

### How It Works

1. **TypeScript compilation**: `api/*.ts` → `api-compiled/*.js` (via `tsconfig.api.json`)
2. **Watch mode**: TypeScript compiler watches for changes
3. **Hot reload**: Express server reloads handlers via ESM dynamic imports with cache-busting
4. **File watcher**: chokidar detects changes to compiled `.js` files

### Limitations

- **Lib changes need restart**: Changes to `api/lib/*` require restarting the dev server
- **New routes need restart**: Adding new API files requires restart to register routes
- **Not 100% production parity**: Express vs Vercel serverless, but compatible for all common use cases

### When to Use `vercel dev`

Use `npm run dev:vercel` when you need:
- Exact production behavior testing
- Vercel-specific features (edge functions, middleware)
- To debug production-only issues

### Searchability Keywords

`slow API` `32 seconds` `vercel dev slow` `WSL2 performance` `@vercel/fun` `process spawning` `cold start` `hot reload` `express dev server`
