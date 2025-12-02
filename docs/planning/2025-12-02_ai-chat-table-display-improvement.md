# Plan: Improve AI Chat Table Display

> **Created:** 2025-12-02
> **Status:** ✅ Complete
> **Author:** Claude
> **Priority:** Enhancement
> **Estimated Scope:** Small (1 file + 1 dependency)

## Summary

Enable proper markdown table rendering in AI chat messages with responsive scrolling and better visual styling.

## Problem

Currently, markdown tables are rendered as **raw text** because `react-markdown` doesn't support GFM (GitHub Flavored Markdown) tables by default. The `remark-gfm` plugin is required.

Example of current broken output:
```
| Ngày | Total Chol | LDL | HDL |
| :--- | :---: | :---: | :---: |
| 30/11/2025 | 199.5 | 145.0 | 40.6 |
```

## Requirements

1. **Parse GFM tables** - Enable markdown table syntax parsing
2. **Responsive scrolling** - Horizontal scroll wrapper so wide tables don't break layout on mobile
3. **Better visual styling** - Borders, zebra striping, header highlighting, cleaner spacing

## Implementation

### Step 1: Install remark-gfm plugin

```bash
npm install remark-gfm
```

### Step 2: Add custom table components to ReactMarkdown

**File:** `src/components/ai/ChatMessage.tsx`

Add `remarkGfm` plugin and custom `components` prop to `ReactMarkdown`:

```tsx
import remarkGfm from 'remark-gfm';

// ...

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    table: ({ children }) => (
      <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-100">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-gray-100 bg-white">{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className="even:bg-gray-50 hover:bg-blue-50/50 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
        {children}
      </td>
    ),
  }}
>
```

### Step 3: Apply to all ReactMarkdown instances

The file has multiple places where `ReactMarkdown` is used:
1. Line 140: Main content rendering (when no citations)
2. Lines 163, 181-183: Citation segment rendering

Extract the remarkPlugins and components config into shared constants and apply to all instances.

### Step 4: Update prose styling to avoid conflicts

Remove or override table-related prose styles in the parent div since custom components will handle table styling:
- Keep `prose prose-sm` for other markdown elements
- Add `prose-table:m-0` to prevent prose margin conflicts

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add `remark-gfm` dependency |
| `src/components/ai/ChatMessage.tsx` | Add remarkGfm plugin and custom table components |

## Testing

1. Send a chat message that produces a table response (e.g., "Show my lipid panel history")
2. Verify table renders properly (not as raw text)
3. Verify responsive scroll on narrow viewport
4. Verify zebra striping and header styling
5. Test with citations to ensure both rendering paths work

## Acceptance Criteria

- [x] Markdown tables render as proper HTML tables
- [x] Tables have horizontal scroll on mobile
- [x] Tables have styled headers and zebra striping
- [x] Existing chat functionality unchanged
