# Changelog

> Last Updated: 2025-12-02

## Summary

Version history and release notes for Digital Medical Twin. Lists all notable changes in reverse chronological order.

## Keywords

`version` `release` `changelog` `history` `updates`

## Table of Contents

- [Unreleased](#unreleased)
- [Phase 6 - Polish and Launch](#phase-6---polish-and-launch-partial)
- [Phase 5 - Data Enhancement](#phase-5---data-enhancement)
- [Phase 4.7 - AI Integration](#phase-47---ai-integration)
- [Phase 2 - Core Data Entry](#phase-2---core-data-entry)
- [Phase 1 - Foundation](#phase-1---foundation)
- [Format](#format)

---

## [Unreleased]

### Added

- **AI Chat Markdown Table Rendering**
  - Tables in AI responses now render as proper HTML tables (not raw markdown)
  - Responsive horizontal scroll for wide tables on mobile
  - Styled with zebra striping, header highlighting, and hover effects
  - Uses `remark-gfm` plugin for GitHub Flavored Markdown support
  - `src/components/ai/ChatMessage.tsx`

- **AI Chat History Persistence**
  - Conversations are now saved to the database and can be continued later
  - ChatGPT-style sidebar showing all past conversations
  - Auto-title from first message, with inline rename support
  - Delete conversations with cascade to messages
  - URL-based conversation access (`/ai?c=<uuid>`)
  - New tables: `ai_conversations`, `ai_messages`
  - New components: `ConversationList`
  - New hooks: `useConversations`
  - Modified: `useAIChat` now persists messages
  - `src/api/conversations.ts`, `src/types/conversations.ts`

- **Per-Conversation AI Settings**
  - Model and settings (provider, model, reasoning level) are saved with each conversation
  - Loading an old conversation restores the settings used when it was created
  - Server now uses conversation-specific settings when making AI calls
  - New conversation uses current global settings
  - Database columns: `provider`, `model`, `reasoning_effort`, `thinking_level` on `ai_conversations`
  - `supabase/migrations/20241203000002_add_conversation_settings.sql`

### Fixed

- **Per-conversation settings not used for AI calls**
  - Server now fetches and uses conversation settings instead of global settings
  - `conversationId` is sent with chat requests
  - Falls back to global settings if conversation has no saved settings
  - `api/ai/chat.ts`, `src/hooks/useAIChat.ts`

- **Settings override not cleared for pre-migration conversations**
  - UI now correctly falls back to global settings when loading conversations without saved settings
  - `src/pages/AIHistorianPage.tsx`

- **AI Chat sidebar not updating when continuing conversation**
  - Sidebar now refreshes after each message to update conversation order and timestamps
  - Added `onMessageSent` callback to `useAIChat` hook
  - `src/hooks/useAIChat.ts`, `src/pages/AIHistorianPage.tsx`

- **AI Chat stuck on invalid conversation URL**
  - Navigating to `/ai?c=<deleted-or-invalid-id>` now properly resets state
  - User can immediately start a new conversation instead of being stuck
  - `src/hooks/useAIChat.ts`

- **AI Chat loading spinner race condition**
  - Fixed spinner disappearing prematurely when sending first message in new conversation
  - Caused by `loadConversation` being triggered via URL change and resetting `isLoading`
  - Fix: Skip loading if conversation is already loaded (e.g., just created)
  - `src/hooks/useAIChat.ts`

### Security

- **RLS WITH CHECK clauses for AI conversations**
  - Added `WITH CHECK` to RLS policies for `ai_conversations` and `ai_messages`
  - Prevents authenticated users from inserting data into other users' conversations
  - `supabase/migrations/20241203000001_fix_ai_conversations_rls.sql`

---

## [1.5.0] - 2025-12-02

> Major feature release: Lab uploads, user profiles, security hardening

### Security

- **Search Filter Injection Prevention**
  - Added `escapePostgrestValue()` utility to sanitize search inputs
  - Applied to `getEvents()` and `getAllEvents()` functions
  - Prevents PostgREST filter syntax injection attacks
  - `src/utils/validation.ts`, `src/api/events.ts`

- **Explicit User Scoping for API Functions**
  - Added auth check + `user_id` filter to `getAISettings()` in `src/api/settings.ts`
  - Added auth + user scoping to all lab upload CRUD functions: `getLabUploads()`, `getLabUpload()`, `updateLabUpload()`, `deleteLabUpload()`, `getLabUploadPdfUrl()`
  - Defense-in-depth layer beyond RLS policies
  - `src/api/settings.ts`, `src/api/labUploads.ts`

### Fixed

- **Test Reliability**
  - Fixed flaky test timeouts by adding fake timers to `LabUploadCard.test.tsx` and `ExtractionPreview.test.tsx`
  - Fixed `TagInput.test.tsx` timeout by using `userEvent.setup({ delay: null })`
  - Updated `useAISettings.test.ts` mocks for new `.eq().maybeSingle()` chain

### Changed

- Replaced `console.error` with `logger.error` in `LabUploadCard.tsx`, `LabUploadList.tsx`, `labUploads.ts`

### Removed

- Deleted unused dead code: `getNextPendingUpload()` and `hasProcessingUpload()` from `src/api/labUploads.ts`

---

## 2025-11-29

### Added

- **Extraction Debug UI**
  - Debug Info tab in ExtractionPreview modal for troubleshooting
  - `DebugTab`, `DebugSummary`, `StageTimeline`, `MatchDetailsTable`, `RawResponseSection` components
  - Captures timing, raw AI responses, and match details for all 3 extraction stages
  - `ExtractionDebugInfo` type in `src/types/labUploads.ts`

- **BiomarkerSelect Component**
  - Searchable dropdown for selecting biomarkers from standards database
  - Groups by category with search across name, code, and aliases
  - `src/components/event/BiomarkerSelect.tsx`

- **Extended Biomarker Categories**
  - Added 9 new categories: autoimmune, blood_gas, coagulation, hematology, mineral, nutrition, pancreatic, tumor_marker, urinalysis
  - Updated `BiomarkerCategory` type and `BIOMARKER_CATEGORIES` map
  - Updated `categoryOrder` in BiomarkerSelect

### Fixed

- **Biomarker.standardCode type regression**: Made `standardCode` optional to support unmatched biomarkers
- **EventNewPage raw biomarker fallback**: Falls back to raw biomarkers when post-processing fails or returns empty
- **BiomarkerInput type guard**: Fixed excludeCodes filter to properly handle undefined values
- **Division by zero in match details**: Added guard for zero originalValue in conversion factor calculation

### Removed

- `src/lib/biomarkerPresets.ts` and `src/lib/biomarkerPresets.test.ts` - Replaced by biomarker_standards database

---

## Phase 6 - Polish and Launch (Partial)

> 2025-11-28

### Added

- **Logging System**
  - Structured logger with DEBUG, INFO, WARN, ERROR levels
  - Console transport with colorized output (dev) and JSON (prod)
  - Sentry integration for production error tracking
  - Correlation IDs (session + operation) for request tracing
  - `withLogger` HOF for API handlers
  - `CorrelationContext` for frontend request tagging
  - `useApiClient` hook with automatic correlation headers
  - Frontend: `src/lib/logger/`, Backend: `api/lib/logger/`
  - Documentation: `docs/development/LOGGING.md`

- **Error Handling**
  - ErrorBoundary component with user-friendly fallback UI
  - Auto-reset on route navigation (keyed by location.pathname)
  - Centralized error handler utility (`src/utils/errorHandler.ts`)
  - Error type detection (network, auth, validation, server, unknown)
  - User-friendly error messages

- **Testing Infrastructure**
  - Vitest test framework with 225 unit tests
  - Test coverage for utilities, hooks, and components
  - Playwright E2E testing with 18 tests
  - Test files: validation, exportData, intentDetector, Input, Modal, TagInput, Button, errorHandler, biomarkerPresets, importData, useDebouncedValue

- **Performance Optimization**
  - Lazy loading for all page components via React.lazy()
  - Suspense wrapper with FullPageSpinner fallback
  - Code-split chunks for each route

- **Security**
  - Security headers in vercel.json (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy)
  - Security documentation (`docs/SECURITY.md`)

### Technical Details

- New files: `src/components/common/ErrorBoundary.tsx`, `src/utils/errorHandler.ts`, `vitest.config.ts`, `playwright.config.ts`, `docs/SECURITY.md`
- New test files: 6 unit test files, 2 E2E test files
- E2E tests cover: auth flows, protected routes, navigation, 404 page

---

## Phase 5 - Data Enhancement

> 2025-11-27

### Added

- **Biomarker Presets**
  - 10 common lab panel presets (Lipid Panel, Basic Metabolic, CMP, CBC, Thyroid, Liver, Iron, Inflammation, HbA1c, Vitamin D)
  - Auto-populate biomarkers with standard names, units, and reference ranges
  - Preset selector dropdown in LabResultForm
  - Auto-fill title when preset selected on empty form

- **Tags System**
  - TagInput component with autocomplete suggestions
  - Tag support on all 5 event forms
  - useUserTags hook fetches user's existing tags
  - Tag display in EventCard
  - TagFilter component for timeline filtering
  - URL-synced tag filters (`?tags=tag1,tag2`)
  - Supabase `overlaps` query for tag filtering

- **Data Export**
  - Export all events as JSON from Settings page
  - Export filtered events from Timeline page
  - CSV export support with column headers
  - Formatted filenames with date stamp
  - Export metadata (version, timestamp, count)

- **Data Import**
  - JSON import with validation
  - ImportModal with drag-and-drop file upload
  - Import preview showing event counts by type
  - Progress indicator during import
  - Error handling with detailed feedback
  - Batch import with individual event error tracking

### Fixed

- Biomarker preset selection now correctly adds biomarkers (fixed stale closure bug)
- Tag filter now works correctly on timeline (added missing filter to getEvents)
- Import modal no longer stuck on spinner when all imports fail
- Export error messages now display on Timeline page

### Technical Details

- New files: `src/lib/biomarkerPresets.ts`, `src/lib/exportData.ts`, `src/lib/importData.ts`
- New hooks: `useUserTags`, `useExportEvents`, `useImportEvents`
- New components: `TagInput`, `TagFilter`, `ImportModal`
- Updated all 5 event forms to include TagInput
- URL filter state managed via `useTimelineFilters` hook

---

## Phase 4.7 - AI Integration

> 2025-11-27

### Added

- **Multi-Provider API Key Management**
  - Separate storage for OpenAI and Google API keys
  - Per-provider encrypted columns: `encrypted_openai_key`, `encrypted_google_key`
  - Users can store keys for both providers simultaneously
  - Automatic key selection based on chosen provider

- **Activity Timeline (ChatGPT-style)**
  - Collapsible panel showing AI reasoning process
  - ThinkingStep component for reasoning traces
  - WebSearchStep with numbered, clickable sources
  - ToolCallStep for function call visibility
  - Elapsed time display ("3m 0s" format)

- **Gemini Grounding & Inline Citations**
  - Full extraction of Gemini `groundingMetadata`
  - Wikipedia-style superscript citation markers `[1,2,3]`
  - Inline citations mapped from `groundingSupports`
  - Numbered sources with actual titles (not just hostnames)
  - Hover tooltips showing source titles
  - Click-to-scroll to sources section

- **Google Gemini Models**
  - Gemini 3 Pro Preview (`gemini-3-pro-preview`)
  - Gemini 2.5 Flash (`gemini-2.5-flash`)
  - Gemini 2.5 Pro (`gemini-2.5-pro`)

### Changed

- Temperature setting disabled for OpenAI (not supported by Responses API)
- WebSearchStep now displays numbered sources with full titles
- ChatMessage renders inline citations as clickable superscripts

### Technical Details

- New types: `InlineCitation`, `WebSearchResult`, `ReasoningTrace`, `ToolCall`, `ActivityItem`
- API returns `citations` array mapping text segments to source indices
- `extractGeminiGrounding` extracts both sources and citation mappings
- React components build citation markers dynamically (no HTML injection)

---

## Phase 2 - Core Data Entry

> 2025-11-26

### Added

- **Event CRUD System**
  - Full create, read, update, delete operations for all 5 event types
  - Single table inheritance pattern in Supabase with RLS policies
  - Type-safe API layer with snake_case to camelCase mapping

- **Event Types & Forms**
  - Lab Result form with dynamic biomarker input (auto-flagging high/low/normal)
  - Doctor Visit form with specialty, facility, diagnosis array
  - Medication form with active status, dosage, frequency tracking
  - Intervention form with category selection (diet, exercise, supplement, sleep, stress)
  - Metric form with source selection (manual, Whoop, Oura, Apple Health, Garmin)

- **UI Components**
  - Select dropdown component with label and error support
  - TextArea component for multi-line input
  - Modal component for dialogs
  - DatePicker form component
  - EventTypeSelector with color-coded buttons
  - EventCard with expandable details view
  - BiomarkerInput for dynamic array entry

- **Pages**
  - TimelinePage with date-grouped event list
  - EventTypeSelectorPage (step 1 of event creation flow)
  - EventNewPage (step 2 with type-specific form)
  - EventDetailPage for viewing/editing existing events

- **Hooks**
  - useEvents - fetch paginated events with filters
  - useEvent - fetch single event by ID
  - useEventMutation - create, update, delete with loading states

- **Dashboard Enhancements**
  - Recent events display (last 5)
  - Quick add buttons for each event type
  - Link to full timeline

- **Developer Tools**
  - Mock data seeding utility (`seedMockEvents()`)
  - Clear all events utility (`clearAllEvents()`)
  - Dev tools bar on Timeline page (development mode only)
  - 10 realistic mock events covering all event types

- **Database**
  - Events table with all type-specific columns
  - Row Level Security (RLS) for user data isolation
  - Indexes for user_id + date and user_id + type
  - Auto-updating `updated_at` trigger

### Technical Details

- Two-step event creation flow: type selection → form entry
- Specific TypeScript input types for proper discriminated union narrowing
- Type guard functions for safe type casting in API layer
- Supabase migrations stored in `supabase/migrations/`

---

## Phase 1 - Foundation

> 2025-11-26

### Added

- Project scaffolding with Vite, React 19, TypeScript 5
- Tailwind CSS v4 styling setup
- Supabase client integration
- Authentication system with email/password
  - Login page and form
  - Registration page and form
  - Auth context with session management
  - Protected route wrapper
- Common UI components (Button, Input, Card, LoadingSpinner)
- Layout components (Header, PageWrapper, AppLayout)
- Routing configuration with react-router-dom v7
- Dashboard page (empty state)
- Settings page (placeholder)
- 404 Not Found page
- TypeScript types for all event types (LabResult, DoctorVisit, Medication, Intervention, Metric)
- API layer structure with auth, events, and settings modules

### Changed

- AUTH_SYSTEM.md updated to reflect Supabase email/password auth (changed from custom username/password)

### Technical Details

- Build: Vite 7.2.4
- Framework: React 19.2.0
- Routing: react-router-dom 7.9.6
- Database: Supabase (@supabase/supabase-js 2.86.0)
- Styling: Tailwind CSS 4.1.17 with @tailwindcss/postcss
- Icons: lucide-react 0.555.0

---

## Format

This changelog follows [Keep a Changelog](https://keepachangelog.com/) format:

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for bug fixes
- **Security** for vulnerability fixes
