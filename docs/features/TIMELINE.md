# Timeline Feature

> Last Updated: 2025-11-26

## Summary

The Master Timeline is the core feature of Digital Medical Twin. A chronological, visually-organized feed displaying all health events. Supports filtering, searching, and infinite scroll.

## Keywords

`timeline` `events` `feed` `chronological` `scroll` `filter` `search` `cards`

## Table of Contents

- [Feature Overview](#feature-overview)
- [Visual Design](#visual-design)
- [Event Cards](#event-cards)
- [Filtering and Search](#filtering-and-search)
- [Infinite Scroll](#infinite-scroll)
- [Implementation Notes](#implementation-notes)

---

## Feature Overview

The Timeline displays all user health events in reverse chronological order (newest first). Each event is rendered as a color-coded card that can be expanded for details.

### User Stories

- As a user, I can view all my health events in one place
- As a user, I can distinguish event types by color at a glance
- As a user, I can expand an event to see full details
- As a user, I can filter events by type, date range, or search query
- As a user, I can scroll infinitely through my history

---

## Visual Design

### Color Coding

| Event Type | Color | Hex |
|------------|-------|-----|
| Lab Result | Red | #EF4444 |
| Doctor Visit | Blue | #3B82F6 |
| Medication | Green | #22C55E |
| Intervention | Amber | #F59E0B |
| Metric | Purple | #8B5CF6 |

### Layout

```
┌─────────────────────────────────────────┐
│  [Filter Bar]  [Search]  [+ Add Event]  │
├─────────────────────────────────────────┤
│                                         │
│  ● ─── March 15, 2024 ──────────────   │
│  │                                      │
│  │  ┌─────────────────────────────┐    │
│  │  │ 🔴 Annual Bloodwork          │    │
│  │  │ Lab Result • Quest Labs      │    │
│  │  │ 12 biomarkers logged         │    │
│  │  └─────────────────────────────┘    │
│  │                                      │
│  ● ─── March 10, 2024 ──────────────   │
│  │                                      │
│  │  ┌─────────────────────────────┐    │
│  │  │ 🔵 Cardiology Follow-up      │    │
│  │  │ Doctor Visit • Dr. Smith     │    │
│  │  │ Click to expand...           │    │
│  │  └─────────────────────────────┘    │
│  │                                      │
│  ▼  [Loading more...]                   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Event Cards

### Collapsed State

Shows:
- Color indicator (left border or icon)
- Event title
- Event type label
- Key metadata (doctor name, biomarker count, etc.)
- Date

### Expanded State

Shows all collapsed info plus:
- Full notes
- All biomarkers (for lab results)
- Diagnosis details (for visits)
- Dosage and schedule (for medications)
- Edit and delete actions

### Card Component Props

```typescript
interface EventCardProps {
  event: HealthEvent;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
```

---

## Filtering and Search

### Filter Options

| Filter | Type | Options |
|--------|------|---------|
| Event Type | Multi-select | All types or specific types |
| Date Range | Date picker | Start date, end date |
| Tags | Multi-select | User-defined tags |

### Search

- Full-text search across:
  - Event titles
  - Notes
  - Doctor names
  - Medication names
  - Biomarker names
- Debounced input (300ms)
- Highlights matching text in results

### Filter State

```typescript
interface TimelineFilters {
  eventTypes: EventType[];       // Empty = all types
  dateRange: {
    start?: Date;
    end?: Date;
  };
  tags: string[];
  searchQuery: string;
}
```

---

## Infinite Scroll

### Behavior

- Load 20 events initially
- Load 20 more when user scrolls near bottom
- Show loading indicator while fetching
- Stop loading when all events retrieved

### Implementation

```typescript
interface PaginationState {
  page: number;
  pageSize: number;              // 20
  hasMore: boolean;
  isLoading: boolean;
}
```

### Scroll Detection

- Use Intersection Observer on sentinel element
- Trigger load when sentinel enters viewport
- Threshold: 200px from bottom

---

## Implementation Notes

### Performance

- Virtualize long lists (only render visible cards)
- Memoize event cards to prevent unnecessary re-renders
- Lazy load expanded content

### Accessibility

- Keyboard navigation between cards
- Screen reader announcements for card actions
- Focus management when expanding/collapsing

### Mobile

- Touch-friendly tap targets (min 44px)
- Swipe actions for edit/delete
- Responsive card layout

---

## Related Documents

- /docs/features/DATA_TRACKING.md — Event types and fields
- /docs/development/COMPONENT_LIBRARY.md — EventCard component
- /docs/architecture/DATABASE_SCHEMA.md — Event data models
