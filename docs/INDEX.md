# Documentation Index

> Last Updated: 2025-12-14 (Theme system documentation added)

## Summary

Master index for all project documentation. Search here first to find relevant docs and sections.

## Keywords

`index` `search` `documentation` `navigation` `reference`

## Table of Contents

- [How to Use This Index](#how-to-use-this-index)
- [Quick Reference](#quick-reference)
- [Keyword Search](#keyword-search)

---

## How to Use This Index

1. Search for keywords related to your task
2. Go to the linked document
3. Read the Summary section first
4. Read only the relevant sections listed

---

## Quick Reference

| Topic | Document | Sections |
|-------|----------|----------|
| Project overview | /docs/ONBOARDING.md | Full doc |
| Tech stack | /docs/ONBOARDING.md | #tech-stack |
| Directory structure | /docs/ONBOARDING.md | #directory-structure |
| Local API development | /docs/ONBOARDING.md | #local-api-development |
| Express dev server | /docs/ONBOARDING.md | #local-api-development |
| WSL2 performance | /docs/ONBOARDING.md | #local-api-development |
| Agent workflow | /docs/AGENT_PROTOCOL.md | Full doc |
| Reading docs | /docs/AGENT_PROTOCOL.md | #reading-strategy |
| Updating docs | /docs/AGENT_PROTOCOL.md | #updating-documentation |
| Doc format | /docs/AGENT_PROTOCOL.md | #document-format-standard |
| Database schema | /docs/architecture/DATABASE_SCHEMA.md | Full doc |
| User authentication | /docs/architecture/AUTH_SYSTEM.md | Full doc |
| System design | /docs/architecture/SYSTEM_OVERVIEW.md | Full doc |
| AI integration | /docs/architecture/AI_INTEGRATION.md | Full doc |
| Timeline feature | /docs/features/TIMELINE.md | Full doc |
| Event types | /docs/features/DATA_TRACKING.md | Full doc |
| AI Historian | /docs/features/AI_HISTORIAN.md | Full doc |
| Insights Dashboard | /docs/features/INSIGHTS_DASHBOARD.md | Full doc |
| Lab Uploads | /docs/features/LAB_UPLOADS.md | Full doc |
| Document Storage | /docs/features/DOCUMENTS.md | Full doc |
| User Profile | /docs/features/USER_PROFILE.md | Full doc |
| Feature ideas (GPT-5.2) | /docs/ideas/gpt-5.2-feature-ideas.md | #high-impact-ideas |
| Feature ideas (Gemini 3 Pro) | /docs/ideas/gemini-3-pro-features.md | Full doc |
| Coding conventions | /docs/development/CODING_STANDARDS.md | Full doc |
| Logging system | /docs/development/LOGGING.md | Full doc |
| Component patterns | /docs/development/COMPONENT_LIBRARY.md | Full doc |
| State management | /docs/development/STATE_MANAGEMENT.md | Full doc |
| API specs | /docs/development/API_CONTRACTS.md | Full doc |
| Testing | /docs/development/TESTING_STRATEGY.md | Full doc |
| Security | /docs/SECURITY.md | Full doc |
| Theme system | /docs/THEME_SYSTEM.md | Full doc |
| Database migrations | /docs/DATABASE_MIGRATIONS.md | Full doc |
| Design decisions | /docs/DECISION_LOG.md | Full doc |
| Version history | /docs/CHANGELOG.md | Full doc |
| Development roadmap | /docs/ROADMAP.md | Full doc |
| Feature suggestions | /docs/ideas/FEATURE_SUGGESTIONS_OPUS_4_5.md | Full doc |
| Manual test cases | /docs/testing/MANUAL_TEST_CASES.md | Full doc |
| E2E test expansion plan | /docs/planning/2025-12-02_e2e-test-expansion.md | Full doc |
| Phase 1 tasks | /docs/ROADMAP.md | #phase-1-foundation (Complete) |
| Phase 2 tasks | /docs/ROADMAP.md | #phase-2-core-data-entry (Complete) |
| Phase 3 tasks | /docs/ROADMAP.md | #phase-3-timeline-polish (Complete) |
| Phase 4 tasks | /docs/ROADMAP.md | #phase-4-ai-integration (Complete) |
| Phase 5 tasks | /docs/ROADMAP.md | #phase-5-data-enhancement (Complete) |
| Phase 6 tasks | /docs/ROADMAP.md | #phase-6-polish-and-launch |

---

## Keyword Search

### A

- **agent**: /docs/AGENT_PROTOCOL.md
- **agentic**: /docs/architecture/AI_INTEGRATION.md#agentic-mode, /docs/features/AI_HISTORIAN.md#agentic-vs-one-shot-mode
- **AI**: /docs/architecture/AI_INTEGRATION.md, /docs/features/AI_HISTORIAN.md
- **allergies**: /docs/ideas/gpt-5.2-feature-ideas.md#allergies-immunizations-procedures
- **API**: /docs/development/API_CONTRACTS.md
- **architecture**: /docs/architecture/SYSTEM_OVERVIEW.md
- **authentication**: /docs/architecture/AUTH_SYSTEM.md

### B

- **biomarkers**: /docs/features/DATA_TRACKING.md, /docs/features/INSIGHTS_DASHBOARD.md, /docs/features/LAB_UPLOADS.md
- **biomarker standards**: /docs/features/LAB_UPLOADS.md#biomarker-standards-database
- **BiomarkersPage**: src/pages/BiomarkersPage.tsx
- **bloodwork**: /docs/features/DATA_TRACKING.md

### C

- **changelog**: /docs/CHANGELOG.md
- **chat history**: /docs/features/AI_HISTORIAN.md#chat-history
- **chokidar**: /docs/ONBOARDING.md#local-api-development
- **cold start**: /docs/ONBOARDING.md#local-api-development
- **charts**: /docs/features/INSIGHTS_DASHBOARD.md
- **citations**: /docs/architecture/AI_INTEGRATION.md#gemini-grounding--citations
- **cloud**: /docs/architecture/DATABASE_SCHEMA.md
- **coding standards**: /docs/development/CODING_STANDARDS.md
- **components**: /docs/development/COMPONENT_LIBRARY.md
- **conversations**: /docs/features/AI_HISTORIAN.md#chat-history, src/api/conversations.ts
- **ConversationList**: src/components/ai/ConversationList.tsx
- **correlation**: /docs/development/LOGGING.md#correlation-ids

### D

- **dark mode**: /docs/THEME_SYSTEM.md, src/styles/globals.css
- **CSS variables**: /docs/THEME_SYSTEM.md#css-variables-reference, src/styles/globals.css
- **dashboard**: /docs/features/INSIGHTS_DASHBOARD.md
- **database**: /docs/architecture/DATABASE_SCHEMA.md, /docs/DATABASE_MIGRATIONS.md
- **decisions**: /docs/DECISION_LOG.md
- **documents**: /docs/features/DOCUMENTS.md
- **document storage**: /docs/features/DOCUMENTS.md
- **DocumentsPage**: src/pages/DocumentsPage.tsx
- **DocumentCard**: src/components/documents/DocumentCard.tsx
- **DocumentList**: src/components/documents/DocumentList.tsx
- **DocumentViewer**: src/components/documents/DocumentViewer.tsx
- **discharge summaries**: /docs/features/DOCUMENTS.md
- **deliverables**: /docs/ROADMAP.md
- **deployment**: /docs/DECISION_LOG.md#2025-11-26-hosting-platform-selection
- **dev server**: /docs/ONBOARDING.md#local-api-development
- **dev:api**: /docs/ONBOARDING.md#local-api-development
- **directory**: /docs/ONBOARDING.md#directory-structure
- **doctor packet**: /docs/ideas/gpt-5.2-feature-ideas.md#care-team-share-packs
- **doctor visits**: /docs/features/DATA_TRACKING.md
- **documentation**: /docs/AGENT_PROTOCOL.md#updating-documentation

### E

- **e2e**: /docs/development/TESTING_STRATEGY.md, /docs/planning/2025-12-02_e2e-test-expansion.md
- **email**: /docs/architecture/AUTH_SYSTEM.md
- **encryption**: /docs/SECURITY.md#api-key-management
- **express**: /docs/ONBOARDING.md#local-api-development
- **events**: /docs/features/DATA_TRACKING.md, src/api/events.ts, src/types/events.ts
- **EventCard**: src/components/event/EventCard.tsx
- **EventForm**: src/components/event/forms/
- **export**: /docs/features/TIMELINE.md#data-export, src/lib/exportData.ts, src/hooks/useExportEvents.ts
- **experiments**: /docs/ideas/gpt-5.2-feature-ideas.md#experiment-and-outcome-tracking

### F

- **family health history**: /docs/ideas/FEATURE_SUGGESTIONS_OPUS_4_5.md#3-family-health-history-module
- **features**: /docs/features/
- **feature ideas**: /docs/ideas/gpt-5.2-feature-ideas.md
- **feature suggestions**: /docs/ideas/FEATURE_SUGGESTIONS_OPUS_4_5.md
- **FHIR**: /docs/ideas/FEATURE_SUGGESTIONS_OPUS_4_5.md#4-fhir-health-records-import, /docs/ideas/gpt-5.2-feature-ideas.md#fhir-and-portal-imports

### G

- **Gemini**: /docs/architecture/AI_INTEGRATION.md
- **grounding**: /docs/architecture/AI_INTEGRATION.md#gemini-grounding--citations
- **GPT**: /docs/architecture/AI_INTEGRATION.md

### H

- **hamburger menu**: src/components/layout/MobileNav.tsx
- **health**: /docs/ONBOARDING.md, /docs/features/DATA_TRACKING.md
- **historian**: /docs/features/AI_HISTORIAN.md
- **hooks**: src/hooks/ (useEvents, useEvent, useEventMutation)
- **hot reload**: /docs/ONBOARDING.md#local-api-development

### I

- **ideas**: /docs/ideas/gpt-5.2-feature-ideas.md
- **imaging**: /docs/features/DOCUMENTS.md
- **immunizations**: /docs/ideas/gpt-5.2-feature-ideas.md#allergies-immunizations-procedures
- **insurance**: /docs/features/DOCUMENTS.md
- **insights**: /docs/features/INSIGHTS_DASHBOARD.md, src/pages/InsightsPage.tsx, src/pages/InsightsDetailPage.tsx
- **InsightsPage**: src/pages/InsightsPage.tsx
- **import**: /docs/features/TIMELINE.md#data-import, src/lib/importData.ts, src/hooks/useImportEvents.ts
- **interventions**: /docs/features/DATA_TRACKING.md
- **IPv6**: /docs/DATABASE_MIGRATIONS.md

### L

- **lab results**: /docs/features/DATA_TRACKING.md#lab-results
- **lab PDF**: /docs/features/DATA_TRACKING.md#pdf-upload--ai-extraction, /docs/architecture/AI_INTEGRATION.md#lab-result-pdf-extraction
- **lab uploads**: /docs/features/LAB_UPLOADS.md
- **logger**: /docs/development/LOGGING.md
- **logging**: /docs/development/LOGGING.md
- **login**: /docs/architecture/AUTH_SYSTEM.md

### M

- **Management API**: /docs/DATABASE_MIGRATIONS.md
- **manual tests**: /docs/testing/MANUAL_TEST_CASES.md
- **medications**: /docs/features/DATA_TRACKING.md
- **metrics**: /docs/features/DATA_TRACKING.md
- **migrations**: /docs/DATABASE_MIGRATIONS.md, scripts/run-migrations.cjs
- **milestones**: /docs/ROADMAP.md
- **mobile**: /docs/CHANGELOG.md#unreleased, src/components/layout/MobileNav.tsx
- **MobileNav**: src/components/layout/MobileNav.tsx
- **MVP**: /docs/ROADMAP.md#phase-1-foundation

### O

- **observations**: /docs/ideas/gpt-5.2-feature-ideas.md#observations-of-daily-living
- **offline**: /docs/DECISION_LOG.md#2025-11-26-offline-support-deferral
- **onboarding**: /docs/ONBOARDING.md
- **one-shot**: /docs/features/AI_HISTORIAN.md#agentic-vs-one-shot-mode, /docs/architecture/AI_INTEGRATION.md#one-shot-fallback

### P

- **password**: /docs/architecture/AUTH_SYSTEM.md
- **private events**: /docs/features/DATA_TRACKING.md#vice-private, src/hooks/useTimelineFilters.ts
- **PDF upload**: /docs/features/DATA_TRACKING.md#pdf-upload--ai-extraction, /docs/architecture/AI_INTEGRATION.md#lab-result-pdf-extraction
- **PDF extraction**: /docs/architecture/AI_INTEGRATION.md#lab-result-pdf-extraction
- **post-processing**: /docs/features/LAB_UPLOADS.md#biomarker-standardization
- **profile**: /docs/features/USER_PROFILE.md
- **ProfileSetupPage**: src/pages/ProfileSetupPage.tsx
- **ProfilePage**: src/pages/ProfilePage.tsx
- **phases**: /docs/ROADMAP.md
- **planning**: /docs/ROADMAP.md, /docs/planning/
- **presets**: See biomarker standards in /docs/features/LAB_UPLOADS.md#biomarker-standards-database
- **product**: /docs/ONBOARDING.md
- **prescriptions**: /docs/features/DOCUMENTS.md
- **protocol**: /docs/AGENT_PROTOCOL.md
- **proxy**: /docs/DECISION_LOG.md#2025-11-26-ai-api-architecture

### R

- **RAG**: /docs/features/AI_HISTORIAN.md
- **React**: /docs/ONBOARDING.md#tech-stack, /docs/development/COMPONENT_LIBRARY.md
- **reasoning_effort**: /docs/architecture/AI_INTEGRATION.md#openai-gpt-52
- **referrals**: /docs/features/DOCUMENTS.md
- **recharts**: /docs/features/INSIGHTS_DASHBOARD.md#6-technical-architecture, src/components/insights/TrendChart.tsx, src/components/insights/SparklineCard.tsx
- **responsive**: /docs/CHANGELOG.md#unreleased, src/components/layout/MobileNav.tsx
- **roadmap**: /docs/ROADMAP.md

### S

- **schema**: /docs/architecture/DATABASE_SCHEMA.md
- **security**: /docs/SECURITY.md
- **symptoms**: /docs/ideas/FEATURE_SUGGESTIONS_OPUS_4_5.md#7-symptom-tracking-event-type
- **sentry**: /docs/development/LOGGING.md
- **seed data**: src/utils/seedEvents.ts
- **server-side API keys**: /docs/architecture/AI_INTEGRATION.md#server-side-api-keys
- **serverless**: /docs/DECISION_LOG.md#2025-11-26-ai-api-architecture
- **session**: /docs/SECURITY.md#authentication-flow
- **setup**: /docs/ONBOARDING.md#setup-instructions
- **sparkline**: src/components/insights/SparklineCard.tsx
- **SSE**: /docs/architecture/AI_INTEGRATION.md#sse-streaming
- **streaming**: /docs/architecture/AI_INTEGRATION.md#sse-streaming, src/components/ai/StreamingIndicator.tsx
- **slow API**: /docs/ONBOARDING.md#local-api-development
- **state**: /docs/development/STATE_MANAGEMENT.md
- **storage**: /docs/architecture/DATABASE_SCHEMA.md
- **supabase**: /docs/DECISION_LOG.md#2025-11-26-database-provider-selection, supabase/migrations/, api/lib/supabase.ts

### T

- **tags**: /docs/features/DATA_TRACKING.md#tags-system, src/components/common/TagInput.tsx, src/hooks/useUserTags.ts
- **Tailwind**: /docs/ONBOARDING.md#tech-stack
- **theme**: /docs/THEME_SYSTEM.md, src/context/ThemeContext.tsx, src/styles/globals.css
- **theme system**: /docs/THEME_SYSTEM.md (architecture, usage, limitations)
- **ThemeContext**: src/context/ThemeContext.tsx, /docs/THEME_SYSTEM.md
- **theme colors**: /docs/THEME_SYSTEM.md#css-variables-reference, src/styles/globals.css
- **multi-theme**: /docs/THEME_SYSTEM.md (Light, Dark, Ocean, Forest)
- **prose-themed**: /docs/THEME_SYSTEM.md#prosemarkdown-content, src/styles/globals.css
- **touch targets**: /docs/CHANGELOG.md#unreleased (44px minimum)
- **tech stack**: /docs/ONBOARDING.md#tech-stack
- **testing**: /docs/development/TESTING_STRATEGY.md, /docs/testing/MANUAL_TEST_CASES.md
- **thinking_level**: /docs/architecture/AI_INTEGRATION.md#google-gemini-3-pro
- **tools**: /docs/architecture/AI_INTEGRATION.md#tool-definitions, api/ai/tools/
- **timeline**: /docs/features/TIMELINE.md, src/pages/TimelinePage.tsx
- **trends**: /docs/features/INSIGHTS_DASHBOARD.md, src/hooks/useBiomarkerTrends.ts, src/lib/insights/dataProcessing.ts
- **TypeScript**: /docs/ONBOARDING.md#tech-stack, tsconfig.api.json (strict mode)

### U

- **unit conversion**: /docs/features/LAB_UPLOADS.md#biomarker-standardization
- **user profile**: /docs/features/USER_PROFILE.md
- **useConversations**: src/hooks/useConversations.ts
- **useUserProfile**: src/hooks/useUserProfile.ts
- **useRequireProfile**: src/hooks/useRequireProfile.ts
- **useDocuments**: src/hooks/useDocuments.ts
- **useDocumentMutation**: src/hooks/useDocumentMutation.ts
- **useDocumentUpload**: src/hooks/useDocumentUpload.ts
- **useSendToLabUploads**: src/hooks/useSendToLabUploads.ts
- **useBiomarkers**: src/hooks/useBiomarkers.ts
- **useBiomarkerTrends**: src/hooks/useBiomarkerTrends.ts
- **useBiomarkerDetail**: src/hooks/useBiomarkerDetail.ts
- **useInsightsTimeRange**: src/hooks/useInsightsTimeRange.ts
- **users**: /docs/ONBOARDING.md

### V

- **vercel**: /docs/DECISION_LOG.md#2025-11-26-hosting-platform-selection
- **verification**: /docs/features/LAB_UPLOADS.md#api-endpoints, /docs/architecture/AI_INTEGRATION.md#response-format
- **verificationStatus**: /docs/features/LAB_UPLOADS.md#api-endpoints, /docs/architecture/AI_INTEGRATION.md#response-format
- **version**: /docs/CHANGELOG.md
- **vice**: /docs/features/DATA_TRACKING.md#vice-private, src/components/event/forms/ViceForm.tsx, src/types/events.ts
- **ViceForm**: src/components/event/forms/ViceForm.tsx
- **vision**: /docs/ROADMAP.md
- **visualization**: /docs/features/INSIGHTS_DASHBOARD.md

### W

- **WCAG**: /docs/CHANGELOG.md#unreleased
- **wearables**: /docs/ideas/FEATURE_SUGGESTIONS_OPUS_4_5.md#1-wearable-device-integration
- **web search**: /docs/architecture/AI_INTEGRATION.md#gemini-grounding--citations
- **WSL2**: /docs/DATABASE_MIGRATIONS.md, /docs/ONBOARDING.md#local-api-development
- **WSL2 performance**: /docs/ONBOARDING.md#local-api-development

### Z

- **zinc**: /docs/CHANGELOG.md#unreleased (dark mode palette)
