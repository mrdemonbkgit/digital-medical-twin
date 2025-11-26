# Development Roadmap

> Last Updated: 2025-11-26

## Summary

Phased development plan for Digital Medical Twin. Defines six phases from foundation to launch, with clear deliverables and dependencies. Reference this for development sequencing and scope.

## Keywords

`roadmap` `phases` `planning` `milestones` `development` `timeline` `deliverables`

## Table of Contents

- [Overview](#overview)
- [Phase 1: Foundation](#phase-1-foundation)
- [Phase 2: Core Data Entry](#phase-2-core-data-entry)
- [Phase 3: Timeline Polish](#phase-3-timeline-polish)
- [Phase 4: AI Integration](#phase-4-ai-integration)
- [Phase 5: Data Enhancement](#phase-5-data-enhancement)
- [Phase 6: Polish and Launch](#phase-6-polish-and-launch)
- [Phase Dependencies](#phase-dependencies)

---

## Overview

| Phase | Name | Goal |
|-------|------|------|
| 1 | Foundation | Basic app shell with auth and persistence |
| 2 | Core Data Entry | Users can create and view health events |
| 3 | Timeline Polish | Beautiful, functional Master Timeline |
| 4 | AI Integration | AI Historian feature |
| 5 | Data Enhancement | Richer data features |
| 6 | Polish and Launch | Production-ready |

### Tech Stack Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Database | Supabase | Auth + DB + realtime in one, good DX |
| Hosting | Vercel | Seamless React deployment, previews |
| AI API | Backend proxy | Secure API keys, rate limiting |
| Offline | Later phase | Reduce initial complexity |

---

## Phase 1: Foundation

**Goal:** Basic app shell with authentication and data persistence

**Status:** Complete (2025-11-26)

### Tasks

- [x] Project scaffolding (React 19, TypeScript, Tailwind v4, Vite)
- [x] Supabase project setup
- [x] Database schema implementation (users, events tables) - SQL ready
- [x] Authentication system
  - [x] Registration page
  - [x] Login page
  - [x] Logout functionality
  - [x] Auth context and protected routes
- [x] Basic routing structure
- [x] Layout components (header, navigation, page wrapper)
- [x] User settings page (placeholder)

### Deliverable

User can create account, log in, and see empty dashboard.

### Dependencies

None (first phase)

### Definition of Done

- [x] User can register with email/password (changed from username)
- [x] User can log in and see authenticated dashboard
- [x] User can log out
- [x] Unauthenticated users redirected to login
- [x] Database connection working (Supabase configured)
- [x] Deployed to Vercel: https://digital-medical-twin.vercel.app/

---

## Phase 2: Core Data Entry

**Goal:** Users can create and view health events

### Tasks

- [ ] Event type system implementation
  - [ ] Base event interface
  - [ ] Lab Result type with biomarkers
  - [ ] Doctor Visit type
  - [ ] Medication type
  - [ ] Intervention type
  - [ ] Metric type
- [ ] Supabase tables for all event types
- [ ] API layer for CRUD operations
- [ ] Event creation flow
  - [ ] Event type selector
  - [ ] Lab Result form (with biomarker entry)
  - [ ] Doctor Visit form
  - [ ] Medication form
  - [ ] Intervention form
  - [ ] Metric form
- [ ] Basic timeline view (chronological list)
- [ ] Event detail view (expand/collapse cards)
- [ ] Edit event functionality
- [ ] Delete event functionality (with confirmation)

### Deliverable

User can log all event types and see them in a chronological list.

### Dependencies

- Phase 1 complete (auth, database, routing)

### Definition of Done

- [ ] User can create each of the 5 event types
- [ ] Events persist to database
- [ ] Events display in timeline (newest first)
- [ ] User can expand event to see details
- [ ] User can edit existing events
- [ ] User can delete events
- [ ] Form validation working

---

## Phase 3: Timeline Polish

**Goal:** Timeline becomes the polished "Master Timeline"

### Tasks

- [ ] Visual design implementation
  - [ ] Color-coded event cards (red, blue, green, amber, purple)
  - [ ] Event type icons
  - [ ] Card layout and typography
- [ ] Date grouping (group events by date)
- [ ] Timeline visual connector (vertical line)
- [ ] Infinite scroll with pagination
- [ ] Filter bar component
  - [ ] Event type filter (multi-select)
  - [ ] Date range picker
- [ ] Search functionality
  - [ ] Search input with debounce
  - [ ] Full-text search across events
  - [ ] Search result highlighting
- [ ] Empty states
  - [ ] No events yet
  - [ ] No search results
  - [ ] No events matching filters
- [ ] Loading states and skeletons
- [ ] Mobile-responsive design
- [ ] Add Event FAB (floating action button)

### Deliverable

Beautiful, functional timeline matching product vision.

### Dependencies

- Phase 2 complete (event CRUD, basic timeline)

### Definition of Done

- [ ] Timeline matches design spec (colors, layout)
- [ ] Infinite scroll loads more events smoothly
- [ ] Filters work correctly (type, date)
- [ ] Search returns relevant results
- [ ] Empty states display appropriately
- [ ] Works on mobile devices
- [ ] Performance acceptable (no jank on scroll)

---

## Phase 4: AI Integration

**Goal:** AI Historian feature

### Tasks

- [ ] Backend API route for AI proxy
  - [ ] Vercel serverless function
  - [ ] Request validation
  - [ ] Rate limiting
- [ ] AI provider abstraction layer
  - [ ] Provider interface
  - [ ] OpenAI GPT-5.1 adapter
  - [ ] Google Gemini 3 Pro adapter
- [ ] API key management
  - [ ] Settings UI for API key entry
  - [ ] Secure storage (encrypted)
  - [ ] Key validation
- [ ] RAG implementation
  - [ ] Query analysis (extract intent, keywords)
  - [ ] Event retrieval based on query
  - [ ] Context building (format events for prompt)
  - [ ] System prompt design
  - [ ] Token management
- [ ] Chat interface UI
  - [ ] Chat page/modal
  - [ ] Message input
  - [ ] Message history display
  - [ ] User and AI message styling
  - [ ] Loading/thinking indicator
- [ ] Source attribution
  - [ ] Show which events were used
  - [ ] Link to source events
- [ ] Model selection (GPT-5.1 vs Gemini 3 Pro)
- [ ] Error handling (API errors, rate limits)

### Deliverable

User can ask questions about their health history and get AI-powered answers.

### Dependencies

- Phase 2 complete (events exist to query)
- Phase 3 recommended (better UX)

### Definition of Done

- [ ] User can configure AI provider and API key
- [ ] User can ask questions in natural language
- [ ] AI responds with relevant, accurate answers
- [ ] Sources shown for AI responses
- [ ] Works with both OpenAI and Gemini
- [ ] Errors handled gracefully
- [ ] API keys never exposed to client

---

## Phase 5: Data Enhancement

**Goal:** Richer data features

### Tasks

- [ ] Biomarker enhancements
  - [ ] Automatic flagging (high/low/normal)
  - [ ] Reference range handling
  - [ ] Common biomarker presets (lipid panel, metabolic, etc.)
  - [ ] Unit standardization
- [ ] Medication enhancements
  - [ ] Active vs historical status
  - [ ] "Currently taking" indicator
  - [ ] End date prompts
- [ ] Intervention tracking
  - [ ] Ongoing indicator
  - [ ] Duration calculation
- [ ] Tags system
  - [ ] Add tags to events
  - [ ] Tag suggestions (existing tags)
  - [ ] Filter by tags
- [ ] Data export
  - [ ] Export all data as JSON
  - [ ] Export filtered data
  - [ ] Download trigger
- [ ] Data import (optional)
  - [ ] JSON import
  - [ ] Validation and error handling

### Deliverable

Full data model with all planned fields and features.

### Dependencies

- Phase 2 complete (core event types)

### Definition of Done

- [ ] Biomarkers auto-flag based on reference ranges
- [ ] Biomarker presets speed up data entry
- [ ] Medications show active/historical status
- [ ] Tags can be added and filtered
- [ ] User can export all data as JSON
- [ ] Data export is complete and re-importable

---

## Phase 6: Polish and Launch

**Goal:** Production-ready application

### Tasks

- [ ] Error handling audit
  - [ ] All API errors handled
  - [ ] User-friendly error messages
  - [ ] Error boundaries for components
- [ ] Validation audit
  - [ ] All forms validated
  - [ ] Server-side validation
  - [ ] Consistent error display
- [ ] Performance optimization
  - [ ] Bundle size analysis
  - [ ] Code splitting
  - [ ] Image optimization
  - [ ] Caching strategy
- [ ] Security audit
  - [ ] Auth flow review
  - [ ] API security review
  - [ ] Data encryption verification
  - [ ] OWASP checklist
- [ ] Accessibility pass
  - [ ] Keyboard navigation
  - [ ] Screen reader testing
  - [ ] Color contrast
  - [ ] Focus management
- [ ] Testing
  - [ ] Unit test coverage
  - [ ] Integration tests
  - [ ] E2E critical paths
- [ ] Documentation
  - [ ] Update all docs
  - [ ] API documentation
  - [ ] User guide (if needed)
- [ ] Launch preparation
  - [ ] Production environment setup
  - [ ] Monitoring and logging
  - [ ] Backup strategy
  - [ ] Domain and SSL

### Deliverable

App ready for users.

### Dependencies

- All previous phases complete

### Definition of Done

- [ ] No critical bugs
- [ ] Performance targets met
- [ ] Security review passed
- [ ] Accessibility audit passed
- [ ] Test coverage meets thresholds
- [ ] Documentation complete
- [ ] Production deployed and monitored

---

## Phase Dependencies

```
Phase 1 (Foundation)
    │
    ▼
Phase 2 (Core Data Entry)
    │
    ├──────────────┬──────────────┐
    ▼              ▼              ▼
Phase 3        Phase 4        Phase 5
(Timeline)     (AI)           (Data)
    │              │              │
    └──────────────┴──────────────┘
                   │
                   ▼
            Phase 6 (Launch)
```

Phases 3, 4, and 5 can be worked on in parallel after Phase 2.

---

## Related Documents

- /docs/architecture/SYSTEM_OVERVIEW.md — System architecture
- /docs/architecture/DATABASE_SCHEMA.md — Data models
- /PRODUCT_DESCRIPTION.md — Product requirements
- /docs/DECISION_LOG.md — Technical decisions
