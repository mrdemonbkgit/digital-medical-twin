# Plan: Expand E2E Test Coverage

> **Created:** 2025-12-02
> **Status:** Planned
> **Author:** Claude
> **Priority:** Quality
> **Estimated Scope:** Medium (3 new test files + fixtures)

## Summary

Add comprehensive e2e tests for AI Chat, Timeline, and Lab Uploads features using Playwright.

## Current State

- **Framework:** Playwright v1.57.0
- **Existing tests:** `e2e/auth.spec.ts` (17 tests), `e2e/navigation.spec.ts` (6 tests)
- **Gap:** No tests for core features (AI Chat, Timeline, Lab Uploads)

## Features to Test

### 1. Timeline & Events (`e2e/timeline.spec.ts`)

**User flows:**
- View events grouped by date
- Expand/collapse event cards
- Search events (with 300ms debounce)
- Filter by event type (chips)
- Filter by date range
- Filter by tags
- Clear filters
- Verify URL params sync with filters
- Empty states (no events, no results)

**Mocking strategy:** Mock Supabase `/rest/v1/events` responses

### 2. AI Chat / Historian (`e2e/ai-chat.spec.ts`)

**User flows:**
- View AI setup screen when not configured
- Send message and see response
- View conversation list
- Create new conversation
- Switch between conversations
- Rename conversation
- Delete conversation
- Suggested questions clickable

**Mocking strategy:**
- Mock `/api/ai/chat` to return instant responses
- Mock `/api/conversations` for CRUD operations

### 3. Lab Uploads (`e2e/lab-uploads.spec.ts`)

**User flows:**
- Upload PDF via dropzone (drag or click)
- See upload progress states (pending → processing → complete)
- View extraction results
- Handle upload errors
- Toggle "Skip verification" option

**Mocking strategy:**
- Use real test PDF file (`e2e/fixtures/test-lab-report.pdf`)
- Mock `/api/ai/process-lab-upload` to return mock extraction data
- Mock Supabase storage upload
- Mock status polling responses

## Implementation

### Step 1: Create auth helper for authenticated tests

**File:** `e2e/helpers/auth.ts`

```typescript
import { Page } from '@playwright/test';

export async function loginAsTestUser(page: Page) {
  // Option A: Use Supabase test user credentials
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(timeline|dashboard)/);
}

// Option B: Set auth cookie directly (faster)
export async function setAuthSession(page: Page, token: string) {
  await page.context().addCookies([...]);
}
```

### Step 2: Create test fixtures

**Directory:** `e2e/fixtures/`

| File | Purpose |
|------|---------|
| `test-lab-report.pdf` | Small PDF for upload tests |
| `mock-events.json` | Sample event data |
| `mock-extraction.json` | Sample lab extraction response |

### Step 3: Create Timeline tests

**File:** `e2e/timeline.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Timeline', () => {
  test.beforeEach(async ({ page }) => {
    // Mock events API
    await page.route('/rest/v1/events*', async route => {
      await route.fulfill({
        status: 200,
        json: { data: mockEvents, total: mockEvents.length }
      });
    });
    // Login and navigate
    await loginAsTestUser(page);
    await page.goto('/timeline');
  });

  test('displays events grouped by date', async ({ page }) => {
    await expect(page.getByText(/Today/i)).toBeVisible();
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(5);
  });

  test('filters by event type', async ({ page }) => {
    await page.getByRole('button', { name: /lab result/i }).click();
    await expect(page).toHaveURL(/type=lab_result/);
  });

  test('searches events with debounce', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('cholesterol');
    await page.waitForTimeout(350); // debounce
    await expect(page.getByText(/cholesterol/i)).toBeVisible();
  });
});
```

### Step 4: Create AI Chat tests

**File:** `e2e/ai-chat.spec.ts`

```typescript
test.describe('AI Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Mock chat API
    await page.route('/api/ai/chat', async route => {
      await route.fulfill({
        status: 200,
        json: {
          content: 'Based on your health data...',
          tokensUsed: 150,
          elapsedTime: '2.5s'
        }
      });
    });
  });

  test('sends message and receives response', async ({ page }) => {
    await page.goto('/ai');
    await page.getByPlaceholder(/ask/i).fill('What are my recent lab results?');
    await page.getByRole('button', { name: /send/i }).click();

    await expect(page.getByText('What are my recent lab results?')).toBeVisible();
    await expect(page.getByText('Based on your health data...')).toBeVisible();
  });
});
```

### Step 5: Create Lab Uploads tests

**File:** `e2e/lab-uploads.spec.ts`

```typescript
test.describe('Lab Uploads', () => {
  test('uploads PDF and shows extraction progress', async ({ page }) => {
    // Mock the processing API
    await page.route('/api/ai/process-lab-upload', async route => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    // Mock status polling (simulate progress)
    let pollCount = 0;
    await page.route('/rest/v1/lab_uploads*', async route => {
      pollCount++;
      const status = pollCount > 3 ? 'complete' : 'processing';
      await route.fulfill({
        status: 200,
        json: [{
          id: 'test-id',
          status,
          processing_stage: 'extracting_gemini',
          extracted_data: status === 'complete' ? mockExtraction : null
        }]
      });
    });

    await page.goto('/lab-uploads');

    // Upload test PDF
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('e2e/fixtures/test-lab-report.pdf');

    // Verify progress shown
    await expect(page.getByText(/processing/i)).toBeVisible();

    // Verify completion
    await expect(page.getByText(/complete/i)).toBeVisible({ timeout: 10000 });
  });
});
```

### Step 6: Add data-testid attributes (if needed)

Add `data-testid` to key elements for reliable selection:
- Event cards: `data-testid="event-card"`
- Filter chips: `data-testid="filter-chip-{type}"`
- Chat messages: `data-testid="chat-message-{role}"`
- Upload dropzone: `data-testid="upload-dropzone"`

## Files to Create/Modify

| File | Action |
|------|--------|
| `e2e/helpers/auth.ts` | Create - Auth utilities |
| `e2e/fixtures/test-lab-report.pdf` | Create - Test PDF |
| `e2e/fixtures/mock-data.ts` | Create - Mock responses |
| `e2e/timeline.spec.ts` | Create - Timeline tests |
| `e2e/ai-chat.spec.ts` | Create - AI Chat tests |
| `e2e/lab-uploads.spec.ts` | Create - Lab Upload tests |
| `.env.test` | Create - Test user credentials |

## Test Environment Setup

```bash
# .env.test (gitignored)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
BASE_URL=http://localhost:5173
```

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run specific test file
npx playwright test timeline.spec.ts

# Run with UI mode (debugging)
npm run test:e2e:ui

# Run headed (see browser)
npx playwright test --headed
```

## Acceptance Criteria

- [ ] Timeline tests cover view, search, filter, empty states
- [ ] AI Chat tests cover send message, conversations, error states
- [ ] Lab Uploads tests cover upload flow with mock API
- [ ] All tests pass in CI (headless Chrome)
- [ ] Tests complete in < 60 seconds total
- [ ] No real AI API calls during tests (all mocked)
