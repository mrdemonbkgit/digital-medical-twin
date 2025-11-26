# Coding Standards

> Last Updated: 2025-11-26

## Summary

Coding conventions and patterns for Digital Medical Twin. Covers naming, file structure, TypeScript usage, error handling, and code style. All agents must follow these standards.

## Keywords

`coding` `standards` `conventions` `naming` `typescript` `style` `patterns` `errors`

## Table of Contents

- [Naming Conventions](#naming-conventions)
- [File Structure](#file-structure)
- [TypeScript Usage](#typescript-usage)
- [Error Handling](#error-handling)
- [Code Style](#code-style)
- [Comments](#comments)

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `EventCard.tsx` |
| Hooks | camelCase with `use` prefix | `useTimeline.ts` |
| Utils | camelCase | `formatDate.ts` |
| Types | PascalCase | `EventTypes.ts` |
| Constants | SCREAMING_SNAKE_CASE file | `API_CONSTANTS.ts` |
| Tests | Same as source + `.test` | `EventCard.test.tsx` |

### Variables and Functions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `eventList`, `isLoading` |
| Functions | camelCase, verb prefix | `getEvents`, `handleClick` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_EVENTS`, `API_URL` |
| Booleans | `is`, `has`, `should` prefix | `isVisible`, `hasError` |
| Event handlers | `handle` prefix | `handleSubmit`, `handleClick` |
| Callbacks | `on` prefix | `onClick`, `onSubmit` |

### Types and Interfaces

| Type | Convention | Example |
|------|------------|---------|
| Interfaces | PascalCase, noun | `User`, `HealthEvent` |
| Type aliases | PascalCase | `EventType`, `APIResponse` |
| Props interfaces | Component + `Props` | `EventCardProps` |
| Enums | PascalCase, singular | `EventType`, `Status` |

---

## File Structure

### Component File

```typescript
// EventCard.tsx

// 1. Imports (external, then internal, then styles)
import React from 'react';
import { formatDate } from '@/utils/formatDate';
import type { HealthEvent } from '@/types';

// 2. Types (component-specific)
interface EventCardProps {
  event: HealthEvent;
  onEdit: (id: string) => void;
}

// 3. Component
export default function EventCard({ event, onEdit }: EventCardProps) {
  // Hooks first
  const [isExpanded, setIsExpanded] = useState(false);

  // Handlers
  const handleToggle = () => setIsExpanded(!isExpanded);

  // Render
  return (
    <div>...</div>
  );
}
```

### Hook File

```typescript
// useTimeline.ts

import { useState, useEffect } from 'react';
import type { HealthEvent, TimelineFilters } from '@/types';

interface UseTimelineReturn {
  events: HealthEvent[];
  isLoading: boolean;
  error: Error | null;
  loadMore: () => void;
}

export function useTimeline(filters: TimelineFilters): UseTimelineReturn {
  // Implementation
}
```

### API File

```typescript
// events.ts

import type { HealthEvent, CreateEventRequest } from '@/types';

export async function getEvents(userId: string): Promise<HealthEvent[]> {
  // Implementation
}

export async function createEvent(data: CreateEventRequest): Promise<HealthEvent> {
  // Implementation
}
```

---

## TypeScript Usage

### Strict Mode

All code must pass TypeScript strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Type Annotations

```typescript
// DO: Explicit return types for public functions
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.value, 0);
}

// DO: Use interfaces for objects
interface User {
  id: string;
  name: string;
}

// DON'T: Use `any`
function process(data: any) { } // Bad

// DO: Use `unknown` and narrow
function process(data: unknown) {
  if (isValidData(data)) {
    // Now typed
  }
}
```

### Null Handling

```typescript
// DO: Use optional chaining
const name = user?.profile?.name;

// DO: Use nullish coalescing
const value = input ?? defaultValue;

// DO: Explicit null checks when needed
if (event.endDate !== null) {
  // Handle end date
}
```

---

## Error Handling

### API Errors

```typescript
// Define error types
interface APIError {
  code: string;
  message: string;
  status: number;
}

// Throw typed errors
async function fetchEvents(): Promise<HealthEvent[]> {
  const response = await fetch('/api/events');

  if (!response.ok) {
    const error: APIError = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}
```

### Component Error Boundaries

- Wrap major sections in error boundaries
- Show user-friendly error messages
- Log errors for debugging

### Try-Catch Usage

```typescript
// DO: Catch specific errors
try {
  await saveEvent(data);
} catch (error) {
  if (error instanceof ValidationError) {
    showValidationMessage(error.message);
  } else {
    showGenericError();
  }
}

// DON'T: Swallow errors silently
try {
  await saveEvent(data);
} catch (error) {
  // Bad: error lost
}
```

---

## Code Style

### Formatting

- Use Prettier for formatting
- 2 space indentation
- Single quotes for strings
- Trailing commas in multiline
- No semicolons (Prettier default)

### Imports

```typescript
// 1. External packages
import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'

// 2. Internal absolute imports
import { Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

// 3. Relative imports
import { helper } from './helper'

// 4. Types (separate if needed)
import type { User } from '@/types'
```

### Component Patterns

```typescript
// Prefer function declarations for components
export default function MyComponent() { }

// Use arrow functions for handlers
const handleClick = () => { }

// Destructure props
function Card({ title, children }: CardProps) { }

// Use fragments to avoid extra divs
return (
  <>
    <Header />
    <Content />
  </>
)
```

---

## Comments

### When to Comment

- Complex business logic
- Non-obvious workarounds
- API contracts and types
- TODO items (with ticket reference)

### When Not to Comment

- Self-explanatory code
- Obvious function names
- Every function/variable

### Comment Style

```typescript
// Single line for brief explanations

/**
 * Multi-line for complex explanations
 * that need more context.
 */

// TODO(#123): Implement caching
// FIXME: Temporary workaround for API bug
```

---

## Related Documents

- /docs/development/COMPONENT_LIBRARY.md — Component patterns
- /docs/development/TESTING_STRATEGY.md — Test conventions
