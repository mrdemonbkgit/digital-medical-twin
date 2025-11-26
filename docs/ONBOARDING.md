# Onboarding

> Last Updated: 2025-11-26

## Summary

Project setup, tech stack, and directory structure. Read this first when starting a new session.

## Keywords

`setup` `install` `structure` `tech stack` `getting started` `directory` `project`

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Setup Instructions](#setup-instructions)
- [Available Scripts](#available-scripts)

---

## Project Overview

Digital Medical Twin is a health tracking application that serves as a digital twin of a user's medical history. Users log health events (bloodwork, doctor visits, medications, interventions, metrics) and query their history using AI (GPT-5.1 or Gemini 3 Pro). Data is stored in the cloud with username/password authentication.

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
| AI | OpenAI GPT-5.1 / Google Gemini 3 Pro | latest |
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
│   ├── /api/                 # API layer
│   ├── /types/               # TypeScript types
│   ├── /utils/               # Utility functions
│   └── /styles/              # Global styles
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
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run test suite |
| `npm run lint` | Run linter |
