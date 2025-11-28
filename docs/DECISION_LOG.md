# Decision Log

> Last Updated: 2025-11-27

## Summary

Record of architectural and design decisions for this project. Search by date or keyword to find relevant decisions. Check here before proposing architectural changes.

## Keywords

`architecture` `decisions` `rationale` `history` `choices`

## Table of Contents

- [2025](#2025)
  - [2025-11-27: Two-stage PDF extraction pipeline](#2025-11-27-two-stage-pdf-extraction-pipeline)
  - [2025-11-27: Server-side AI API keys](#2025-11-27-server-side-ai-api-keys)
  - [2025-11-26: Cloud storage over local-first](#2025-11-26-cloud-storage-over-local-first)
  - [2025-11-26: AI model selection](#2025-11-26-ai-model-selection)
  - [2025-11-26: Documentation structure for AI agents](#2025-11-26-documentation-structure-for-ai-agents)
  - [2025-11-26: Database provider selection](#2025-11-26-database-provider-selection)
  - [2025-11-26: Hosting platform selection](#2025-11-26-hosting-platform-selection)
  - [2025-11-26: AI API architecture](#2025-11-26-ai-api-architecture)
  - [2025-11-26: Offline support deferral](#2025-11-26-offline-support-deferral)

---

## 2025

### 2025-11-27: Two-stage PDF extraction pipeline

**Context:** Users wanted to upload lab result PDFs and have biomarkers automatically extracted instead of manual entry.

**Options Considered:**
1. Single-model extraction — One AI model extracts data from PDF
2. OCR + parsing — Traditional OCR followed by rule-based parsing
3. Two-stage pipeline — First model extracts, second model verifies

**Decision:** Two-stage AI pipeline (Gemini extraction + GPT verification)

**Rationale:**
- **Higher accuracy**: Verification pass catches extraction errors
- **Cross-validation**: Different models may catch different mistakes
- **Transparency**: Users see corrections made during verification
- **Confidence scores**: Can flag low-confidence extractions for user review

**Architecture:**
1. User uploads PDF to Supabase Storage (`lab-pdfs` bucket)
2. Stage 1: Gemini 3 Pro (thinking: high) extracts all data as structured JSON
3. Stage 2: GPT-5.1 (reasoning: high) verifies against original PDF, makes corrections
4. Form auto-populated with verified data

**Consequences:**
- Higher API costs (two models per extraction)
- Longer extraction time (~10-15s)
- Better accuracy than single-model approach
- Clear correction tracking for user transparency
- Requires both OpenAI and Google API keys

**Keywords:** `PDF` `extraction` `AI` `Gemini` `GPT` `verification` `lab results`

---

### 2025-11-27: Server-side AI API keys

**Context:** Previously, users had to provide their own API keys for OpenAI and Google. This created UX friction and security complexity (encrypting/storing keys).

**Options Considered:**
1. User-provided keys (existing) — Users bring their own keys, stored encrypted
2. Server-side keys — App provides API keys, centralized billing
3. Hybrid — Default server keys with option for user keys

**Decision:** Server-side API keys only

**Rationale:**
- **Simpler UX**: Users just select a provider, no key management
- **Better security**: No user keys to encrypt/store, fewer attack vectors
- **Centralized billing**: Easier to track usage and costs
- **Faster onboarding**: Users can try AI features immediately

**Consequences:**
- Removed user API key input from settings UI
- Removed encryption logic for API keys
- API keys stored as Vercel environment variables
- Added provider-specific reasoning parameters:
  - OpenAI: `reasoning_effort` (none, minimal, low, medium, high)
  - Gemini: `thinking_level` (low, high)
- Legacy database columns (`encrypted_*`) left in place but unused

**Keywords:** `AI` `API keys` `security` `UX` `server-side`

---

### 2025-11-26: Cloud storage over local-first

**Context:** Needed to decide on data persistence strategy for user health data.

**Options Considered:**
1. LocalStorage (browser only) — Simple, maximum privacy, but no sync across devices
2. Cloud database — Sync across devices, requires auth, data on servers

**Decision:** Cloud database with username/password authentication

**Consequences:**
- Need to implement authentication system
- Users can access data from any device
- Need to ensure data security and encryption
- Future consideration: offline-first sync strategy

**Keywords:** `storage` `database` `cloud` `authentication` `sync`

---

### 2025-11-26: AI model selection

**Context:** Needed to select AI models for the RAG-powered health historian feature.

**Options Considered:**
1. OpenAI GPT-4o — Proven, widely used
2. OpenAI GPT-5.1 — Latest generation, superior reasoning
3. Google Gemini 1.5 Pro — Large context window
4. Google Gemini 3 Pro — Latest generation, advanced capabilities

**Decision:** Support both GPT-5.1 and Gemini 3 Pro, user's choice

**Consequences:**
- Need to implement adapter pattern for multiple AI providers
- Users bring their own API keys
- Must handle different API formats and rate limits

**Keywords:** `AI` `GPT` `Gemini` `RAG` `models`

---

### 2025-11-26: Documentation structure for AI agents

**Context:** Project will be developed primarily by AI agents (Claude, Codex, Cursor). Need documentation that agents can efficiently navigate.

**Options Considered:**
1. Single large README — Simple but hard to search
2. Flat docs folder — Easy to find files but no organization
3. Hierarchical docs with index — More complex but searchable and scalable

**Decision:** Hierarchical /docs/ structure with INDEX.md for searchability

**Consequences:**
- Agents must update INDEX.md with every doc change
- Docs organized by purpose: architecture, features, development
- Tool-specific configs (CLAUDE.md, AGENTS.md, .cursor/rules) point to shared docs
- Docs optimized for section-based reading, not linear reading

**Keywords:** `documentation` `agents` `structure` `INDEX` `searchability`

---

### 2025-11-26: Database provider selection

**Context:** Needed to select a cloud database provider for storing user data and health events.

**Options Considered:**
1. Firebase — Google ecosystem, good DX, proprietary
2. Supabase — Open source, PostgreSQL, auth included, good DX
3. PlanetScale — MySQL, serverless, good scaling
4. Custom (self-hosted PostgreSQL) — Full control, more ops work

**Decision:** Supabase

**Consequences:**
- Get auth + database + realtime in one package
- PostgreSQL gives us relational data model
- Row Level Security for data isolation
- Good TypeScript support with generated types
- Vendor dependency, but open source and exportable

**Keywords:** `database` `supabase` `postgresql` `hosting` `auth`

---

### 2025-11-26: Hosting platform selection

**Context:** Needed to select hosting platform for the React frontend.

**Options Considered:**
1. Vercel — Optimized for React/Next.js, great DX, preview deployments
2. Netlify — Similar to Vercel, good for static sites
3. AWS (S3 + CloudFront) — More control, more complexity
4. Self-hosted — Maximum control, maximum ops burden

**Decision:** Vercel

**Consequences:**
- Seamless deployment from Git
- Preview environments for PRs
- Edge functions for API routes
- Good performance defaults
- Free tier sufficient for initial development

**Keywords:** `hosting` `vercel` `deployment` `frontend`

---

### 2025-11-26: AI API architecture

**Context:** Needed to decide how to handle AI API calls (OpenAI, Google).

**Options Considered:**
1. Direct client calls — Simpler, but exposes API keys in browser
2. Backend proxy — API keys secure on server, adds complexity
3. Supabase Edge Functions — Serverless, integrated with our DB

**Decision:** Backend proxy via Vercel serverless functions

**Consequences:**
- API keys stored securely in environment variables
- Can implement rate limiting per user
- Can log usage and errors server-side
- Slight latency increase (extra hop)
- Need to build proxy endpoints

**Keywords:** `AI` `API` `proxy` `security` `serverless` `vercel`

---

### 2025-11-26: Offline support deferral

**Context:** Needed to decide whether to implement offline-first architecture from the start.

**Options Considered:**
1. Offline-first from day one — Best UX, complex architecture
2. Online-only initially, offline later — Simpler start, retrofit later
3. Online-only permanently — Simplest, but limited UX

**Decision:** Online-only initially, with offline support as a future phase

**Consequences:**
- Simpler initial architecture
- Faster time to MVP
- Will need to architect for future offline support
- Users need internet connection to use app
- May need to refactor when adding offline

**Keywords:** `offline` `architecture` `MVP` `phasing`
