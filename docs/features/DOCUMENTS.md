# Document Storage Feature

> Last Updated: 2025-12-06

## Summary

Dedicated page for storing and organizing health-related documents (PDFs, images). Supports categorization by document type with optional lab extraction for PDF lab results. Storage-only feature (no AI processing) that integrates with existing Lab Uploads for biomarker extraction when needed.

## Keywords

`documents` `document storage` `file upload` `PDF` `images` `categories` `labs` `prescriptions` `imaging` `discharge summaries` `insurance` `referrals`

## Table of Contents

- [Overview](#overview)
- [User Flow](#user-flow)
- [Categories](#categories)
- [Lab Extraction Integration](#lab-extraction-integration)
- [Components](#components)
- [Database Schema](#database-schema)
- [API Functions](#api-functions)

---

## Overview

### Problem Solved

Users need a place to store health-related documents that don't fit into specific event types. This includes insurance cards, referral letters, imaging reports, and other miscellaneous health documents. Previously, there was no way to organize and access these files.

### Solution

A dedicated `/documents` page where users:
1. Upload PDFs and images (drag & drop or click)
2. Categorize documents by type
3. Add optional metadata (title, date, description)
4. View, edit, and delete documents
5. For lab result PDFs, optionally send for biomarker extraction

### Key Features

| Feature | Description |
|---------|-------------|
| Multiple File Types | PDF, JPG, PNG, HEIC (up to 10MB each) |
| 7 Categories | Labs, Prescriptions, Imaging, Discharge Summaries, Insurance, Referrals, Other |
| Category Filtering | Filter document list by category with count badges |
| Document Viewer | In-app PDF/image preview with download option |
| Lab Extraction | Send lab PDFs to existing Lab Uploads for biomarker extraction |
| Metadata | Optional title, description, and document date |

---

## User Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  1. User navigates to /documents                                  │
│       (from navigation menu)                                      │
├──────────────────────────────────────────────────────────────────┤
│  2. Select category, optionally add title and date                │
├──────────────────────────────────────────────────────────────────┤
│  3. Drag & drop file or click to upload                           │
│       - PDF or images (JPG, PNG, HEIC)                           │
│       - Max 10MB per file                                        │
├──────────────────────────────────────────────────────────────────┤
│  4. Document appears in list under selected category              │
│       - Click category tabs to filter                            │
│       - Count badges show documents per category                 │
├──────────────────────────────────────────────────────────────────┤
│  5. Document actions:                                             │
│       - View: Opens file in new tab                              │
│       - Preview: In-app document viewer                          │
│       - Edit: Update metadata                                    │
│       - Delete: Remove document                                  │
│       - Extract (labs PDFs only): Send to Lab Uploads            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Categories

| Category | Icon | Description |
|----------|------|-------------|
| Labs | TestTube2 | Lab test results and blood work reports |
| Prescriptions | Pill | Medication prescriptions and pharmacy records |
| Imaging | ScanLine | X-rays, MRIs, CT scans, ultrasounds |
| Discharge Summaries | FileText | Hospital discharge summaries and notes |
| Insurance | Shield | Insurance cards, EOBs, coverage documents |
| Referrals | Send | Referral letters from providers |
| Other | File | Any other health-related documents |

---

## Lab Extraction Integration

For documents in the "Labs" category with PDF mime type, users can optionally extract biomarkers:

1. **Extract Biomarkers button** - Shown on lab PDF cards
2. **Sends to Lab Uploads** - Copies file to lab-pdfs bucket
3. **Creates lab_upload record** - Links document to extraction job
4. **Triggers processing** - Uses existing AI extraction pipeline
5. **View results** - Link to Lab Uploads page for extraction status

The document's `labUploadId` field tracks whether extraction was requested. Once set, the "Extract" button changes to "View Extraction Results".

---

## Components

| Component | File | Purpose |
|-----------|------|---------|
| DocumentUploadDropzone | `src/components/documents/DocumentUploadDropzone.tsx` | Drag-drop upload with category/metadata inputs |
| DocumentCard | `src/components/documents/DocumentCard.tsx` | Display document with actions |
| DocumentList | `src/components/documents/DocumentList.tsx` | Category-filtered list with tabs |
| DocumentViewer | `src/components/documents/DocumentViewer.tsx` | In-app preview modal |
| DocumentEditModal | `src/components/documents/DocumentEditModal.tsx` | Edit metadata modal |

---

## Database Schema

### documents Table

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'labs', 'prescriptions', 'imaging',
    'discharge_summaries', 'insurance', 'referrals', 'other'
  )),
  title TEXT,
  description TEXT,
  document_date DATE,
  lab_upload_id UUID REFERENCES lab_uploads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Storage Bucket

- **Bucket name:** `documents`
- **File size limit:** 10MB
- **Allowed types:** `application/pdf`, `image/jpeg`, `image/png`, `image/heic`
- **RLS:** User can only access own files (based on path prefix)

---

## API Functions

Located in `src/api/documents.ts`:

| Function | Description |
|----------|-------------|
| `getDocuments(category?)` | List user's documents, optionally filtered by category |
| `getDocument(id)` | Get single document by ID |
| `createDocument(input)` | Create new document record |
| `updateDocument(id, input)` | Update document metadata |
| `deleteDocument(id)` | Delete document and storage file |
| `getDocumentUrl(storagePath)` | Get signed URL for viewing (1hr expiry) |
| `getDocumentCounts()` | Get document count per category |

---

## Related Documents

- [Lab Uploads](/docs/features/LAB_UPLOADS.md) - Biomarker extraction from lab PDFs
- [Database Schema](/docs/architecture/DATABASE_SCHEMA.md) - Full database documentation
- [Database Migrations](/docs/DATABASE_MIGRATIONS.md) - Migration patterns
