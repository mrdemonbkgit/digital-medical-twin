# Theme System Architecture

> Last Updated: 2025-12-14

## Summary

This app uses a **runtime CSS variable theme system** that supports multiple themes. This document explains the architecture, usage patterns, and known limitations.

## Keywords

`theme` `CSS variables` `dark mode` `light mode` `ocean` `forest` `colors` `styling` `prose`

---

## Overview

### Supported Themes
- `light` (default)
- `dark`
- `ocean`
- `forest`

### How Themes Work

Themes are switched by setting the `data-theme` attribute on `<html>`:

```html
<html data-theme="dark">
```

The `ThemeContext` (src/context/ThemeContext.tsx) manages theme state and persists it to localStorage.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   src/styles/globals.css                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. CSS Variables (per theme)                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ :root, [data-theme="light"] {                       │   │
│  │   --bg-primary: #ffffff;                            │   │
│  │   --text-secondary: #4b5563;                        │   │
│  │   ...                                               │   │
│  │ }                                                   │   │
│  │ [data-theme="dark"] {                               │   │
│  │   --bg-primary: #09090b;                            │   │
│  │   --text-secondary: #a1a1aa;                        │   │
│  │   ...                                               │   │
│  │ }                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                            ↓                                │
│  2. Custom Utility Classes                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ .text-theme-secondary { color: var(--text-secondary); } │
│  │ .bg-theme-primary { background: var(--bg-primary); }    │
│  │ ...                                                     │
│  └─────────────────────────────────────────────────────┘   │
│                            ↓                                │
│  3. Special Classes                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ .prose-themed { --tw-prose-body: var(--text-secondary); }│
│  │ .input-theme { ... }                                    │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Runtime vs Build-Time

**Important**: This is a runtime theme system. CSS variables change when `data-theme` changes, allowing instant theme switching without page reload.

This differs from Tailwind's built-in dark mode (`dark:` prefix) which is determined at build time or based on system preference.

---

## CSS Variables Reference

### Backgrounds

| Variable | Purpose | Light | Dark |
|----------|---------|-------|------|
| `--bg-primary` | Cards, modals, elevated surfaces | #ffffff | #09090b |
| `--bg-secondary` | Page background | #f9fafb | #18181b |
| `--bg-tertiary` | Hover states, subtle backgrounds | #f3f4f6 | #27272a |
| `--bg-elevated` | Dropdowns, popovers | #ffffff | #27272a |

### Text

| Variable | Purpose | Light | Dark |
|----------|---------|-------|------|
| `--text-primary` | Headings, important text | #111827 | #fafafa |
| `--text-secondary` | Body text, descriptions | #4b5563 | #a1a1aa |
| `--text-tertiary` | Subtle text, labels | #6b7280 | #71717a |
| `--text-muted` | Disabled text, hints | #9ca3af | #52525b |

### Borders

| Variable | Purpose |
|----------|---------|
| `--border-primary` | Default borders |
| `--border-secondary` | Emphasized borders |

### Interactive

| Variable | Purpose |
|----------|---------|
| `--accent-primary` | Primary buttons, links, focus rings |
| `--accent-hover` | Hover state for accent elements |

### Status Colors

| Variable | Purpose |
|----------|---------|
| `--status-success` | Success messages, positive indicators |
| `--status-success-bg` | Success background |
| `--status-warning` | Warnings, caution indicators |
| `--status-warning-bg` | Warning background |
| `--status-danger` | Errors, destructive actions |
| `--status-danger-bg` | Danger background |
| `--status-info` | Information, tips |
| `--status-info-bg` | Info background |

### Event Types

Each event type has text and background colors:
- `--event-lab`, `--event-lab-bg`
- `--event-visit`, `--event-visit-bg`
- `--event-medication`, `--event-medication-bg`
- `--event-intervention`, `--event-intervention-bg`
- `--event-metric`, `--event-metric-bg`
- `--event-vice`, `--event-vice-bg`

### Form Inputs

| Variable | Purpose |
|----------|---------|
| `--input-bg` | Input background |
| `--input-border` | Input border |
| `--input-border-focus` | Focused input border |
| `--input-placeholder` | Placeholder text |

---

## Usage Guide

### DO: Use theme classes directly

```tsx
// Text colors
<p className="text-theme-secondary">Body text</p>
<h1 className="text-theme-primary">Heading</h1>
<span className="text-theme-muted">Hint text</span>

// Background colors
<div className="bg-theme-primary">Card</div>
<div className="bg-theme-secondary">Page section</div>

// Accent/status colors
<span className="text-accent">Link</span>
<div className="bg-success-muted text-success">Success</div>
```

### DO: Use CSS variables in custom styles

```tsx
// Inline styles
<div style={{ color: 'var(--text-primary)' }}>Custom</div>

// CSS modules or styled components
.myComponent {
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
}
```

### DON'T: Use theme classes with Tailwind modifiers

```tsx
// WRONG - These will NOT work!
<p className="hover:text-theme-primary">Text</p>
<p className="sm:text-theme-secondary">Text</p>
<p className="prose-p:text-theme-secondary">Text</p>
<p className="dark:text-theme-primary">Text</p>
```

**Why?** Our `.text-theme-*` classes are plain CSS classes, not Tailwind utilities. Tailwind modifiers (`hover:`, `sm:`, `prose-p:`, `dark:`) only work with utilities registered in Tailwind's theme system.

### DON'T: Use Tailwind's dark: prefix

```tsx
// WRONG - We don't use Tailwind's dark mode
<p className="dark:text-white">Text</p>
```

Our themes are controlled via `data-theme` attribute, not Tailwind's dark mode.

---

## Special Cases

### Prose/Markdown Content

For markdown content rendered with `@tailwindcss/typography`, use the `.prose-themed` class:

```tsx
import ReactMarkdown from 'react-markdown';

<div className="prose prose-sm prose-themed">
  <ReactMarkdown>{content}</ReactMarkdown>
</div>
```

The `.prose-themed` class overrides Tailwind Typography's default colors by setting the `--tw-prose-*` CSS variables to use our theme variables.

### Form Inputs

Use the `.input-theme` class for form inputs:

```tsx
<input className="input-theme px-3 py-2 rounded-lg" />
<textarea className="input-theme px-3 py-2 rounded-lg" />
```

This applies proper background, border, text, and placeholder colors.

---

## Adding New Theme Colors

### Step 1: Add CSS variable to each theme

In `src/styles/globals.css`, add the variable to ALL theme blocks:

```css
:root,
[data-theme="light"] {
  --my-new-color: #3b82f6;
}

[data-theme="dark"] {
  --my-new-color: #60a5fa;
}

[data-theme="ocean"] {
  --my-new-color: #22d3ee;
}

[data-theme="forest"] {
  --my-new-color: #4ade80;
}
```

### Step 2: Create utility class(es)

```css
.text-my-new-color { color: var(--my-new-color); }
.bg-my-new-color { background-color: var(--my-new-color); }
.border-my-new-color { border-color: var(--my-new-color); }
```

### Step 3: Use in components

```tsx
<span className="text-my-new-color">Colored text</span>
```

---

## Known Limitations

### 1. Tailwind modifiers don't work with theme classes

Our theme classes are plain CSS, not registered Tailwind utilities. Modifiers like `hover:`, `sm:`, `group-hover:`, etc. won't work.

**Workaround**: Use CSS for hover states:

```css
.my-button {
  color: var(--text-secondary);
}
.my-button:hover {
  color: var(--text-primary);
}
```

### 2. No dark: prefix support

We use `data-theme` attribute, not Tailwind's built-in dark mode.

### 3. Tailwind Typography needs .prose-themed

The prose plugin has its own color system. Always add `prose-themed` class alongside `prose`.

### 4. Some Tailwind utilities use hardcoded colors

Tailwind utilities like `text-gray-500` use hardcoded colors that don't adapt to themes. Always prefer our theme classes.

---

## File References

| File | Purpose |
|------|---------|
| `src/styles/globals.css` | Theme definitions, CSS variables, utility classes |
| `src/context/ThemeContext.tsx` | Theme state management, persistence |
| `src/components/common/ThemeSelector.tsx` | Theme picker UI component |

---

## Related Documentation

- /docs/development/CODING_STANDARDS.md - Coding conventions
- /docs/development/COMPONENT_LIBRARY.md - Component patterns
