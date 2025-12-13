# Changelog

> Last Updated: 2025-12-13

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

- **AI Chat UX Improvements**
  - Stop streaming button with AbortController support
  - Regenerate AI response action
  - Edit user messages inline with textarea UI
  - Delete messages with confirmation dialog
  - Copy message with visual feedback ("Copied!")
  - Rich streaming progress with step-by-step tool execution visibility
  - Activity panel summary line (always visible when collapsed)
  - Error recovery UI with retry, new conversation, and dismiss actions
  - ARIA live regions for screen reader announcements
  - Keyboard shortcuts: Cmd/Ctrl+/ (focus input), Cmd/Ctrl+\ (toggle sidebar), Escape (stop/close), Arrow Up (edit last), Cmd/Ctrl+Shift+O (copy response)
  - Skip link for keyboard navigation
  - Conversation search with debounced filtering
  - Date groupings in conversation list (Today, Yesterday, Previous 7 days, This month, Older)
  - Bottom sheet sidebar on mobile (drag-to-close)
  - Swipe gestures on chat messages (swipe left to reveal actions)
  - Shared tool labels constants for consistent naming

- **New Components**
  - `ErrorRecovery` - Actionable error display with retry options
  - `BottomSheet` - Mobile-friendly draggable bottom sheet
  - `useAriaAnnounce` - Hook for screen reader announcements
  - `useKeyboardShortcuts` - Hook for global keyboard shortcuts
  - `useSwipe` - Hook for touch swipe gesture detection

- **Multi-Theme System (4 Themes)**
  - New theme selector in Settings page: Light, Dark, Ocean, Forest, System
  - System mode follows OS preferences via `prefers-color-scheme`
  - CSS Variables architecture with `[data-theme="name"]` selectors
  - Semantic color tokens for consistent theming across all components
  - Theme persisted to localStorage
  - `src/context/ThemeContext.tsx`, `src/types/theme.ts`, `src/styles/globals.css`

### Changed

- **CSS Variables Theme Architecture**
  - Replaced Tailwind `dark:` prefix approach with CSS Variables
  - New semantic utility classes: `bg-theme-primary`, `text-theme-secondary`, etc.
  - Status colors: `text-danger`, `bg-success-muted`, `text-warning`, etc.
  - Event type colors: `bg-event-lab`, `text-event-medication`, etc.
  - Input styling via `input-theme` class
  - Updated 87 component files to use theme utility classes

- **Subtle Dark Theme Colors**
  - Event backgrounds now use low-saturation tints instead of harsh saturated colors
  - Status backgrounds (danger, success, warning, info) softened for dark themes
  - Lab Result cards: `#2a2020` (subtle warm gray) instead of `#450a0a` (harsh red)
  - Better eye comfort for extended use in dark environments

- **Header Redesign**
  - Compact stacked app name: "DIGITAL" (small label) + "MedTwin" (brand)
  - Header uses `bg-theme-tertiary` for visual separation from page content
  - Navigation links now use `whitespace-nowrap` to prevent text wrapping
  - Icons use `flex-shrink-0` for consistent sizing
  - Responsive breakpoint changed from `sm` (640px) to `lg` (1024px)
  - Mobile hamburger menu now shows on tablets and foldable devices

- **Lab Result Color Redesign**
  - Changed from red to teal for better UX
  - Red had "danger/alert" connotation; teal has clinical/medical feel
  - Light: `#0d9488` (teal-600), Dark: `#5eead4` (teal-300)

### Fixed

- Modal borders now visible in dark theme (`border-theme-secondary`)
- Event type selector cards use theme-aware CSS variables instead of hardcoded colors
- Header navigation no longer overflows on tablets and foldable devices

### Theme System Cleanup & Polish

- **Accessibility Improvements**
  - Added `aria-label` attributes to ChatInput textarea and send button
  - Installed `focus-trap-react` for modal keyboard accessibility
  - Modal now traps focus when open, preventing tab navigation escape
  - TagInput touch target increased to 44px minimum

- **Component Theme Fixes**
  - LoadingSpinner: `text-blue-600` → `text-accent`
  - ErrorBoundary: hardcoded red/gray → semantic `bg-danger-muted`, `text-danger`
  - AddEventFAB: `hover:opacity-90` → `hover:bg-accent-hover` for semantic hover
  - TimelineConnector: hardcoded event colors → `bg-event-*` semantic classes
  - EventTypeFilterChips: Labs/Metrics colors → `bg-event-lab`, `bg-event-metric`
  - TimelinePage delete button: `text-red-600` → `text-danger`
  - Document components: hardcoded colors → theme utility classes
  - LabUpload components: gray backgrounds → `bg-theme-secondary`
  - InsightsPage: hardcoded colors → semantic theme classes

- **Chart Theme Integration**
  - TrendChart now uses CSS variables directly in Recharts SVG props
  - CartesianGrid: `stroke="var(--border-primary)"`
  - Axis labels: `stroke="var(--text-muted)"`
  - Reference areas: `fill="var(--status-success)"`
  - Data lines: `stroke="var(--accent-primary)"`

- **CSS Additions**
  - Added `bg-accent-muted` (20% opacity) and `bg-accent-subtle` (10% opacity) via `color-mix()`

- **Test Suite Updates**
  - Updated 30+ test files to use semantic color classes instead of hardcoded Tailwind colors
  - Added focus-trap-react mocks for Modal, ExtractionPreview, and LabUploadList tests
  - Fixed silent test passes in EventCard delete tests with proper assertions
  - All 2,948 tests passing

### Added (previous)

- **Insights Page Search Bar**
  - Search biomarkers by name or code
  - Live filtering with result count
  - Clear button and empty state
  - `src/pages/InsightsPage.tsx`

- **Mobile Navigation Drawer**
  - New hamburger menu on mobile for full navigation access
  - Slide-out drawer with all nav items, user info, and logout
  - Replaces hidden desktop nav on small screens
  - `src/components/layout/MobileNav.tsx`

- **Touch-Friendly Message Actions**
  - Chat message actions now accessible on mobile via tap
  - Visible "more" button on mobile, hover on desktop
  - Click-outside to close menu behavior
  - All action buttons meet 44px minimum touch target

- **Insights Dashboard with Biomarker Trends**
  - New `/insights` page with dashboard overview of all biomarkers
  - Sparkline cards grouped by category showing trend and latest value
  - Flags banner showing count of high/low biomarkers
  - Time range filter (3M, 6M, 1Y, All)
  - Category filter with localStorage persistence
  - Detail page (`/insights/:code`) with full trend chart
  - Reference range bands (green shaded area) on charts
  - Stats panel: current, average, min, max, trend direction
  - Mobile responsive layout
  - New dependencies: `recharts`, `date-fns`
  - Files: `src/pages/InsightsPage.tsx`, `src/pages/InsightsDetailPage.tsx`
  - Components: `src/components/insights/` (7 components)
  - Hooks: `useBiomarkerTrends.ts`, `useBiomarkerDetail.ts`
  - Data processing: `src/lib/insights/dataProcessing.ts`

- **Vice Event Type for Privacy-Sensitive Tracking**
  - 6th event type for tracking harmful behaviors (alcohol, pornography, smoking, drugs)
  - Data-level privacy enforcement via `is_private` column (always true for vice)
  - Timeline filter toggle to show/hide private events
  - Slate color scheme (`#64748b`) for non-attention-grabbing display
  - Categories: alcohol, pornography, smoking, drugs with category-specific units
  - Fields: viceCategory, quantity, unit, context, trigger
  - Full AI context integration (agentic and one-shot modes)
  - Database migration: `20241204000000_add_vice_event_type.sql`
  - `src/components/event/forms/ViceForm.tsx`

- **Comprehensive Unit Test Coverage**
  - Expanded from 566 tests to 2824 tests across 153 test files
  - Coverage by layer:
    - Pages: 100% (16/16) - All page components tested
    - Components: 99% (68/69) - All components except duplicate ErrorBoundary
    - Hooks: 100% (22/22) - All custom hooks tested
    - Frontend API: 100% (7/7) - Full API layer coverage
    - Backend API: 100% (15/15) - All endpoints tested
    - Lib: 94% (17/18) - Type definitions excluded
    - Utils: 100% (6/6) - All utility functions tested
  - New test files for: all pages, event forms, AI components, insights, timeline, layout, backend logger, AI providers
  - Updated `docs/development/TESTING_STRATEGY.md` with current coverage metrics

### Changed

- **Strict TypeScript for API Code**
  - Enabled `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, `strictFunctionTypes: true` in `tsconfig.api.json`
  - Fixed 11 type errors in `api/ai/chat.ts` (timings type, closure variable assignment)
  - API code now has same type safety as frontend code

- **Centralized Supabase Client Creation**
  - Extracted duplicated Supabase client creation into `api/lib/supabase.ts`
  - Exports `createSupabaseClient()`, `getUserId()`, and `SupabaseClientAny` type
  - Reduced ~112 lines of duplicated code across 4 files
  - Affected files: `api/ai/chat.ts`, `api/ai/extract-lab-results.ts`, `api/ai/process-lab-upload.ts`, `api/settings/ai.ts`

### Fixed

- **Lab Extraction: Detection Limit Values**
  - Values like `<3` now correctly parsed to numeric `3` in post-processing
  - Deterministic parsing instead of relying on AI prompts
  - `api/ai/process-lab-upload.ts`

- **Lab Extraction: Qualitative Biomarker Classification**
  - S/CO ratio biomarkers (HBsAg, Anti-HCV) no longer incorrectly marked as qualitative
  - Trust database `standard_unit` over Gemini's `isQualitative` flag
  - Fixes "Qualitative value is required" validation errors
  - `api/ai/process-lab-upload.ts`

- **Lab Extraction: Unified Pipeline**
  - All PDFs now use per-page extraction (CHUNK_PAGE_THRESHOLD=1)
  - Per-page prompt now includes URINALYSIS handling for qualitative values
  - Fixes null values for urine dipstick biomarkers
  - `api/ai/process-lab-upload.ts`

- **Free Androgen Index Unit Conversion**
  - Added % to ratio conversion (1:1) for FAI biomarker
  - `supabase/migrations/20241211000000_fix_free_androgen_index_unit.sql`

---

## Phase 6 - Polish and Launch (Partial)

### Added

- **Agentic Mode Toggle**
  - New setting to switch between Agentic Mode (tool-based) and One-Shot Mode (all data upfront)
  - Toggle available in Settings page (global default) and chat header (per-conversation)
  - Mode locks per-conversation after first message (prevents context inconsistency)
  - Agentic mode disabled for Gemini (API limitation: can't combine Google Search + function calling)
  - Database: `agentic_mode` column added to `user_settings` and `ai_conversations`
  - `supabase/migrations/20241203000003_add_agentic_mode.sql`

- **SSE Streaming for AI Chat**
  - Real-time feedback during AI processing via Server-Sent Events
  - Shows current tool being executed (e.g., "Checking medications...", "Searching health timeline...")
  - Tool call counter shows total tools used
  - New `StreamingIndicator` component replaces generic loading spinner
  - `src/components/ai/StreamingIndicator.tsx`

- **Agentic AI Chat with Tool-Based Data Retrieval**
  - AI now uses tools to retrieve health data on-demand instead of dumping all context upfront
  - 6 tools: `search_events`, `get_biomarker_history`, `get_profile`, `get_recent_labs`, `get_medications`, `get_event_details`
  - Faster responses with reduced initial context (minimal profile only)
  - Tool calls visible in chat UI (like web search results)
  - Falls back to one-shot approach on error
  - Configurable max tool iterations via `AI_MAX_TOOL_ITERATIONS` env var (default 10)
  - `api/ai/tools/definitions.ts`, `api/ai/tools/executor.ts`

- **AI Chat Message Actions Popup**
  - Hover actions menu on assistant messages with Copy and Details options
  - Copy message content to clipboard with visual feedback
  - Message Details modal showing: model name, token usage (input/output/total), parameters (reasoning_effort, thinking_level), elapsed time
  - Extended `MessageMetadata` type with detailed token breakdown
  - API returns full metadata for new messages
  - `src/components/ai/MessageActionsMenu.tsx`, `src/components/ai/MessageDetailsModal.tsx`

- **Unit Test Coverage Expansion**
  - Added 144 new tests across 7 test files
  - API layer: `conversations.test.ts`, `events.test.ts`, `settings.test.ts`
  - Hooks: `useAIChat.test.ts`, `useConversations.test.ts`, `useEvents.test.ts`
  - Context: `AuthContext.test.tsx`
  - Total: 566 tests across 31 test files
  - Increased global test timeout to 15s in `vitest.config.ts`

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

- **Mobile Touch Targets Too Small**
  - Increased Button component sizes (sm: h-8→h-9, md: h-10→h-11)
  - EventCard action buttons now 44x44px minimum
  - Modal close buttons now 44x44px minimum
  - BiomarkerInput delete button now 44x44px minimum
  - FilterBar toggle now meets 44px minimum height

- **Per-conversation settings not used for AI calls**
  - Server now fetches and uses conversation settings instead of global settings
  - `conversationId` is sent with chat requests
  - Falls back to global settings if conversation has no saved settings
  - `api/ai/chat.ts`, `src/hooks/useAIChat.ts`

- **Settings override not cleared for pre-migration conversations**
  - UI now correctly falls back to global settings when loading conversations without saved settings
  - `src/pages/AIHistorianPage.tsx`

- **Changing global AI model affected all conversation displays**
  - Conversation-specific settings were falling back to global settings via `??` operator
  - Now uses saved settings directly without per-field global fallback
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
