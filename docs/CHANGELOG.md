# Changelog

> Last Updated: 2025-11-27

## Summary

Version history and release notes for Digital Medical Twin. Lists all notable changes in reverse chronological order.

## Keywords

`version` `release` `changelog` `history` `updates`

## Table of Contents

- [Unreleased](#unreleased)
- [Phase 4.7 - AI Integration](#phase-47---ai-integration)
- [Phase 2 - Core Data Entry](#phase-2---core-data-entry)
- [Phase 1 - Foundation](#phase-1---foundation)
- [Format](#format)

---

## Unreleased

### Added

- N/A

### Changed

- N/A

### Fixed

- N/A

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
