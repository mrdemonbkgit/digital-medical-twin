# Testing Strategy

> Last Updated: 2025-12-06

## Summary

Testing approach for Digital Medical Twin. Covers test types, tools, patterns, and coverage requirements. All new features must include tests.

## Current Test Coverage

**Total: 2852 tests across 155 test files**

### Test Files by Layer

| Layer | Files | Tests (approx) |
|-------|-------|----------------|
| Components (`src/components/`) | 68 | ~900 |
| Hooks (`src/hooks/`) | 23 | ~370 |
| Lib (`src/lib/`) | 17 | ~300 |
| Pages (`src/pages/`) | 16 | ~250 |
| Backend API (`api/`) | 15 | ~200 |
| API Layer (`src/api/`) | 7 | ~150 |
| Utils (`src/utils/`) | 6 | ~100 |
| Context (`src/context/`) | 2 | ~40 |

### Coverage by Category

| Category | Coverage | Notes |
|----------|----------|-------|
| Pages | 100% (16/16) | All page components tested |
| Components | 99% (68/69) | Only duplicate ErrorBoundary untested |
| Hooks | 100% (23/23) | All custom hooks tested |
| Frontend API | 100% (7/7) | Full API layer coverage |
| Backend API | 100% (15/15) | All endpoints tested |
| Lib | 94% (17/18) | Type definitions excluded |
| Utils | 100% (6/6) | All utility functions tested |
| Context | 100% (2/2) | Auth and Correlation contexts tested |

### Key Test Areas

**Components:**
- Authentication forms (LoginForm, RegisterForm, ProtectedRoute)
- Event management (EventCard, EventTypeSelector, all 6 event forms)
- AI chat (ChatMessage, PDFUpload, activity components)
- Insights (TrendChart, SparklineCard, CategoryFilter)
- Timeline (FilterBar, SearchInput, DateRangeFilter)
- Layout (Header, MobileNav, AppLayout)

**Hooks:**
- AI integration (`useAIChat`, `useAISettings`, `useConversations`)
- Data management (`useEvents`, `useBiomarkers`, `useProfile`)
- Lab uploads (`useLabUploads`, `useLabUploadMutation`, `useLabUploadProcessor`)
- UI state (`useImportData`, `useConfirmDialog`)

**Backend:**
- AI handlers (`chat`, `extract-lab-results`, `process-lab-upload`)
- API endpoints (`settings/ai`, all tools)
- Logger transports (console, file, sentry)
- Utility functions (biomarkerMerger, pdfSplitter)

## Keywords

`testing` `tests` `unit` `integration` `e2e` `coverage` `jest` `vitest`

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Types](#test-types)
- [Tools and Setup](#tools-and-setup)
- [Test Patterns](#test-patterns)
- [Coverage Requirements](#coverage-requirements)
- [Running Tests](#running-tests)

---

## Testing Philosophy

### Principles

1. **Test behavior, not implementation**: Tests should verify what the code does, not how it does it
2. **Prefer integration over unit**: Test components with their dependencies when practical
3. **Fast feedback**: Keep tests fast to encourage running them often
4. **Readable tests**: Tests serve as documentation; make them clear

### What to Test

| Priority | What | Why |
|----------|------|-----|
| High | Business logic | Core functionality |
| High | API contracts | Integration points |
| Medium | Component behavior | User interactions |
| Medium | Edge cases | Error handling |
| Low | UI styling | Visual changes |
| Low | Third-party code | Not our responsibility |

---

## Test Types

### Unit Tests

Test isolated functions and utilities.

**Location:** `src/**/*.test.ts`

**Examples:**
- Date formatting utilities
- Validation functions
- Data transformations
- Biomarker flag calculations

```typescript
// utils/formatDate.test.ts
import { formatDate, formatRelativeDate } from './formatDate';

describe('formatDate', () => {
  it('formats ISO date to readable string', () => {
    expect(formatDate('2024-03-15')).toBe('March 15, 2024');
  });

  it('handles invalid dates gracefully', () => {
    expect(formatDate('invalid')).toBe('Invalid date');
  });
});
```

### Component Tests

Test React components with user interactions.

**Location:** `src/components/**/*.test.tsx`

**Examples:**
- Form submissions
- Button clicks
- State changes
- Conditional rendering

```typescript
// components/EventCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from './EventCard';

describe('EventCard', () => {
  const mockEvent = {
    id: '1',
    type: 'lab_result',
    title: 'Annual Bloodwork',
    date: '2024-03-15',
  };

  it('renders event title', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Annual Bloodwork')).toBeInTheDocument();
  });

  it('expands on click', () => {
    render(<EventCard event={mockEvent} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('expanded-content')).toBeVisible();
  });
});
```

### Integration Tests

Test multiple components working together.

**Location:** `src/**/*.integration.test.tsx`

**Examples:**
- Form submission flow
- Context provider + consumer
- API calls + state updates

```typescript
// features/timeline.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { Timeline } from './Timeline';
import { EventsProvider } from '@/contexts/EventsContext';

describe('Timeline integration', () => {
  it('loads and displays events', async () => {
    render(
      <EventsProvider>
        <Timeline />
      </EventsProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Annual Bloodwork')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

Test complete user flows.

**Location:** `e2e/**/*.spec.ts`

**Examples:**
- Login flow
- Create event flow
- AI chat flow

```typescript
// e2e/create-event.spec.ts
import { test, expect } from '@playwright/test';

test('user can create a lab result event', async ({ page }) => {
  await page.goto('/timeline');
  await page.click('button:has-text("Add Event")');
  await page.click('[data-type="lab_result"]');
  await page.fill('[name="title"]', 'Blood Test');
  await page.click('button:has-text("Save")');

  await expect(page.locator('.event-card')).toContainText('Blood Test');
});
```

---

## Tools and Setup

### Test Runner

**Vitest** for unit and component tests:
- Fast execution
- ESM native
- Jest-compatible API

### Testing Library

**React Testing Library** for component tests:
- Tests user behavior
- Encourages accessibility
- Avoids implementation details

### E2E Framework

**Playwright** for end-to-end tests:
- Cross-browser support
- Auto-waiting
- Visual debugging

### Mocking

```typescript
// Mock API calls
import { vi } from 'vitest';
import * as api from '@/api/events';

vi.mock('@/api/events', () => ({
  getEvents: vi.fn().mockResolvedValue([mockEvent]),
}));

// Mock context
const mockContext = {
  events: [mockEvent],
  createEvent: vi.fn(),
};

render(
  <EventsContext.Provider value={mockContext}>
    <Component />
  </EventsContext.Provider>
);
```

---

## Test Patterns

### Arrange-Act-Assert

```typescript
it('calculates biomarker flag correctly', () => {
  // Arrange
  const biomarker = { value: 150, referenceMax: 100 };

  // Act
  const flag = calculateFlag(biomarker);

  // Assert
  expect(flag).toBe('high');
});
```

### Test Data Factories

```typescript
// tests/factories.ts
export function createMockEvent(overrides = {}): HealthEvent {
  return {
    id: 'test-id',
    type: 'lab_result',
    date: '2024-03-15',
    title: 'Test Event',
    ...overrides,
  };
}

// Usage
const event = createMockEvent({ title: 'Custom Title' });
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useTimeline } from './useTimeline';

describe('useTimeline', () => {
  it('loads events on mount', async () => {
    const { result } = renderHook(() => useTimeline());

    await waitFor(() => {
      expect(result.current.events).toHaveLength(5);
    });
  });

  it('filters events by type', async () => {
    const { result } = renderHook(() => useTimeline());

    act(() => {
      result.current.setFilters({ type: 'lab_result' });
    });

    expect(result.current.events.every(e => e.type === 'lab_result')).toBe(true);
  });
});
```

---

## Coverage Requirements

### Minimum Thresholds

| Metric | Minimum |
|--------|---------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

### Critical Paths

100% coverage required for:
- Authentication logic
- Data validation
- Biomarker calculations
- API error handling

### Excluded from Coverage

- Type definitions
- Configuration files
- Generated code
- Test utilities

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific file
npm test EventCard.test.tsx

# Run in watch mode
npm test -- --watch

# Run E2E tests
npm run test:e2e

# Run E2E with UI
npm run test:e2e -- --ui
```

### CI Integration

Tests run on every PR:
1. Lint check
2. Type check
3. Unit + Component tests
4. Integration tests
5. E2E tests (on main branch)

### Pre-commit Hook

```bash
# Runs automatically before commit
npm test -- --related --bail
```

---

## Related Documents

- /docs/development/CODING_STANDARDS.md — Code conventions
- /docs/development/API_CONTRACTS.md — API specs to test against
