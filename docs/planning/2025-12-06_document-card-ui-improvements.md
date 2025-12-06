# Plan: DocumentCard UI Improvements

> **Created:** 2025-12-06
> **Status:** Ready for implementation

## Summary

Improve the DocumentCard UI with better text display, cleaner action buttons, and a visual redesign. Based on patterns from LabUploadCard and EventCard components.

## Current Issues

From screenshot analysis:
1. **Text truncation** - Filename "Bumru..." too aggressively truncated
2. **Crowded actions** - 4 icon buttons clustered, hard to tap
3. **Redundant actions** - "View file" vs "Preview" confusing
4. **Visual density** - Card feels cramped, lacks visual hierarchy

---

## Implementation

### File to Modify
`src/components/documents/DocumentCard.tsx`

---

### 1. Better Text Display

**Current:**
```
Bumru...        [icons]
Bumrun...
315.2 KB • 3/2/2023
[Labs]
```

**Improved:**
```
Bumrungrad Blood Test Results    [icons]
lab-results-jan-2023.pdf
315.2 KB • Mar 2, 2023
```

Changes:
- Show full title (or filename if no title) with `line-clamp-2` for 2-line wrap
- Show filename below only if title exists, using lighter color
- Better date formatting with month name
- Remove category badge from here (move to visual indicator)

---

### 2. Cleaner Actions

**Current:** 4 buttons (View, Preview, Edit, Delete)

**Improved:** 3 buttons with clearer purpose
- **View** (Eye icon) - Opens preview modal
- **Edit** (Pencil icon) - Opens edit modal
- **Delete** (Trash icon) - Deletes document

Remove "External Link" button - redundant with View. Add "Open in new tab" option inside the preview modal instead.

Touch targets:
- Add `min-w-[44px] min-h-[44px]` to all buttons
- Increase gap from `gap-1` to `gap-2`

---

### 3. Visual Redesign

**Category-based left border color:**
```tsx
const categoryColors: Record<DocumentCategory, string> = {
  labs: 'border-l-red-400',
  prescriptions: 'border-l-green-400',
  imaging: 'border-l-purple-400',
  discharge_summaries: 'border-l-orange-400',
  insurance: 'border-l-blue-400',
  referrals: 'border-l-cyan-400',
  other: 'border-l-gray-400',
};
```

**Card structure:**
```tsx
<div className={`
  border border-gray-200 rounded-lg bg-white
  border-l-4 ${categoryColors[document.category]}
  hover:shadow-md transition-shadow
`}>
  {/* Header row with better spacing */}
  <div className="p-4">
    <div className="flex items-start gap-4">
      {/* Icon - larger */}
      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-50">
        <FileIcon className="h-6 w-6 text-gray-600" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 line-clamp-2">
          {document.title || document.filename}
        </h3>
        {document.title && (
          <p className="text-sm text-gray-500 truncate mt-0.5">
            {document.filename}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
          <span>{formatFileSize(document.fileSize)}</span>
          <span>•</span>
          <span>{formatDate(document.documentDate)}</span>
        </div>
      </div>

      {/* Actions - better spacing */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]">
          <Eye className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]">
          <Pencil className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px] text-gray-400 hover:text-red-600">
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  </div>

  {/* Extract section - unchanged structure, just cleaner divider */}
  {(canExtract || hasExtraction) && (
    <div className="px-4 pb-4 pt-3 border-t border-gray-100">
      ...
    </div>
  )}
</div>
```

---

### 4. Additional Polish

- **Hover state:** `hover:shadow-md` (slightly more prominent)
- **Icon size:** Increase from `h-4 w-4` to `h-5 w-5`
- **File icon:** Larger `w-12 h-12` container with `h-6 w-6` icon
- **Date format:** Use `toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })` for "Mar 2, 2023"

---

## Before / After

**Before:**
- Cramped layout
- 4 confusing action buttons
- Aggressive text truncation
- Gray category badge taking space

**After:**
- Spacious layout with clear hierarchy
- 3 clear action buttons with touch targets
- 2-line title wrap, full filename visible
- Color-coded left border for category (no badge needed)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/documents/DocumentCard.tsx` | Full redesign |
| `src/components/documents/DocumentCard.test.tsx` | Update tests for removed button |

---

## Reference Patterns

- Left border color: `src/components/event/EventCard.tsx`
- Touch targets: 44px minimum per WCAG guidelines
- Card hover: `src/components/labUpload/LabUploadCard.tsx`
