# Lab Uploads Feature

> Last Updated: 2025-11-29

## Summary

Dedicated page for uploading lab result PDFs and queueing them for AI-powered extraction. Features a 3-stage AI pipeline (Gemini extraction → GPT verification → Gemini post-processing) that standardizes biomarkers against a database of ~100 common markers with unit conversion and gender-specific reference ranges.

**Note:** This is a personal health tracking app. Patient information (name, gender, birthday) is extracted from PDFs but not stored or displayed since the user is assumed to be the patient. Gender for reference ranges comes from the user's profile.

## Keywords

`lab uploads` `PDF extraction` `queue` `async processing` `Gemini` `GPT` `verification` `biomarkers` `biomarker standards` `unit conversion` `post-processing`

## Table of Contents

- [Overview](#overview)
- [User Flow](#user-flow)
- [Architecture](#architecture)
- [Components](#components)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Status & Progress](#status--progress)

---

## Overview

### Problem Solved

The previous PDF extraction was synchronous - users had to wait on the form while extraction completed. With large PDFs and the two-stage AI pipeline (Gemini extraction + GPT verification), this could take 30+ seconds, causing poor UX and potential timeouts.

### Solution

A dedicated `/lab-uploads` page where users:
1. Upload PDFs (drag & drop)
2. See extraction progress in real-time
3. Review extracted data when complete
4. Click "Create Event" to open pre-filled Lab Result form
5. Save event and return to uploads page

### Key Features

| Feature | Description |
|---------|-------------|
| Async Processing | Uploads process in background while user continues working |
| Sequential Queue | One upload processes at a time to avoid rate limits |
| Optional Verification | Users can skip GPT verification for faster results |
| Persistent Storage | Uploads remain until explicitly deleted |
| Pre-filled Forms | Extracted data auto-populates Lab Result form |
| Biomarker Standardization | AI matches extracted biomarkers to ~100 standard definitions |
| Unit Conversion | Automatically converts SI to US conventional units |
| Reference Ranges | Gender-specific reference ranges from standards database |
| Match Status | Clear indication of matched vs unmatched biomarkers |

---

## User Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  1. User navigates to /lab-uploads                               │
│       (from Dashboard "Upload Lab" or Lab Result form link)      │
├──────────────────────────────────────────────────────────────────┤
│  2. Drag & drop PDF or click to upload                           │
│       - Optional: Check "Skip verification" for faster results   │
├──────────────────────────────────────────────────────────────────┤
│  3. Upload appears with status badge                             │
│       - Pending → Processing → Complete/Failed                   │
│       - Processing shows current stage                           │
├──────────────────────────────────────────────────────────────────┤
│  4. When complete, user clicks "Create Event"                    │
│       - Opens /event/new/lab_result?fromUpload={id}              │
│       - Form pre-filled with extracted data                      │
├──────────────────────────────────────────────────────────────────┤
│  5. User reviews, edits if needed, saves                         │
│       - Event linked to upload record                            │
│       - Redirects back to /lab-uploads                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lab Upload Processing                         │
├─────────────────────────────────────────────────────────────────┤
│  1. File Upload                                                  │
│     - Upload to Supabase Storage (lab-pdfs bucket)              │
│     - Create lab_uploads record (status: pending)               │
│                                                                  │
│  2. Trigger Processing                                           │
│     - Call /api/ai/process-lab-upload                           │
│     - Update status to 'processing'                             │
│                                                                  │
│  3. Stage 1: Gemini Extraction                                   │
│     - processing_stage: 'extracting_gemini'                      │
│     - Extract biomarkers, lab info, test date, metadata          │
│     - Patient info extracted but not stored (personal app)       │
│                                                                  │
│  4. Stage 2: GPT Verification (optional)                         │
│     - processing_stage: 'verifying_gpt'                          │
│     - Verify and correct extraction                             │
│     - Skip if skip_verification = true                          │
│                                                                  │
│  5. Stage 3: Post-Processing (Gemini)                            │
│     - processing_stage: 'post_processing'                        │
│     - Match biomarkers to standards database                    │
│     - Convert units to US conventional (mg/dL, etc.)            │
│     - Apply gender-specific reference ranges                    │
│     - Flag high/low/normal values                               │
│     - Mark unmatched biomarkers for review                      │
│                                                                  │
│  6. Complete                                                     │
│     - status: 'complete' or 'failed'                            │
│     - extracted_data.processedBiomarkers populated              │
│     - error_message populated on failure                        │
└─────────────────────────────────────────────────────────────────┘
```

### Polling Model

The frontend polls for status updates when any upload is processing:

| State | Poll Interval |
|-------|---------------|
| Has processing uploads | 2 seconds |
| All complete/failed | No polling |

---

## Components

### Page

| Component | Path | Description |
|-----------|------|-------------|
| LabUploadsPage | `src/pages/LabUploadsPage.tsx` | Main page with dropzone and list |

### Lab Upload Components

| Component | Path | Description |
|-----------|------|-------------|
| LabUploadDropzone | `src/components/labUpload/LabUploadDropzone.tsx` | Drag & drop upload zone |
| LabUploadCard | `src/components/labUpload/LabUploadCard.tsx` | Individual upload with status |
| LabUploadList | `src/components/labUpload/LabUploadList.tsx` | Grouped list of uploads |
| ExtractionPreview | `src/components/labUpload/ExtractionPreview.tsx` | Modal showing extracted data |

### Hooks

| Hook | Path | Description |
|------|------|-------------|
| useLabUploads | `src/hooks/useLabUploads.ts` | Fetch uploads with polling |
| useLabUploadMutation | `src/hooks/useLabUploadMutation.ts` | CRUD operations |
| useLabUploadProcessor | `src/hooks/useLabUploadProcessor.ts` | Upload + trigger extraction |

### API

| File | Description |
|------|-------------|
| `src/api/labUploads.ts` | Client-side API functions |
| `api/ai/process-lab-upload.ts` | Serverless extraction endpoint |

---

## Database Schema

### lab_uploads Table

```sql
CREATE TABLE public.lab_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  processing_stage TEXT
    CHECK (processing_stage IN ('fetching_pdf', 'extracting_gemini', 'verifying_gpt', 'post_processing')),
  skip_verification BOOLEAN NOT NULL DEFAULT false,
  extracted_data JSONB,
  extraction_confidence DECIMAL(3,2),
  verification_passed BOOLEAN,
  corrections TEXT[],
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL
);
```

### RLS Policies

| Policy | Rule |
|--------|------|
| Select | Users can only see their own uploads |
| Insert | Users can only create for themselves |
| Update | Users can only update their own uploads |
| Delete | Users can only delete their own uploads |

---

## API Endpoints

### Process Lab Upload

```
POST /api/ai/process-lab-upload
Authorization: Bearer <supabase_token>
Content-Type: application/json

{
  "uploadId": "uuid"
}
```

**Response:**

```typescript
{
  success: boolean;
  extractedData?: ExtractedLabData;
  extractionConfidence?: number;
  verificationPassed?: boolean;
  corrections?: string[];
  error?: string;
}
```

### Client API Functions

```typescript
// Fetch all uploads for current user
getLabUploads(): Promise<LabUpload[]>

// Fetch single upload
getLabUpload(id: string): Promise<LabUpload | null>

// Create upload record
createLabUpload(input: CreateLabUploadInput): Promise<LabUpload>

// Update upload (e.g., link to event)
updateLabUpload(id: string, input: UpdateLabUploadInput): Promise<LabUpload>

// Delete upload and associated file
deleteLabUpload(id: string): Promise<void>

// Check if any upload is currently processing
hasProcessingUpload(): Promise<boolean>

// Get next pending upload to process
getNextPendingUpload(): Promise<LabUpload | null>

// Get signed URL for PDF
getLabUploadPdfUrl(storagePath: string): Promise<string>
```

---

## Status & Progress

### Status Values

| Status | Description | Card Display |
|--------|-------------|--------------|
| `pending` | Waiting in queue | Yellow badge, "Pending" |
| `processing` | Currently extracting | Blue badge, spinner, stage text |
| `complete` | Successfully extracted | Green badge, "Create Event" button |
| `failed` | Extraction failed | Red badge, error message, "Retry" button |

### Processing Stages

| Stage | Display Text |
|-------|-------------|
| `fetching_pdf` | "Fetching PDF..." |
| `extracting_gemini` | "Extracting with Gemini..." |
| `verifying_gpt` | "Verifying with GPT..." |
| `post_processing` | "Matching biomarkers to standards..." |

### Card Actions

| Status | Actions Available |
|--------|-------------------|
| pending | Delete |
| processing | (none - wait for completion) |
| complete | Preview, Create Event, Delete |
| failed | Retry, Delete |

---

## Biomarker Standardization

### Overview

After AI extraction, biomarkers are matched to a standards database containing ~100 common lab markers. This enables:
- Consistent naming across different lab providers
- Unit conversion to US conventional units
- Gender-specific reference ranges
- Accurate high/low/normal flagging

### ProcessedBiomarker Type

```typescript
interface ProcessedBiomarker {
  // Original extracted data
  originalName: string;
  originalValue: number;
  originalUnit: string;
  // Matched standard (null if unmatched)
  standardCode: string | null;      // e.g., 'LDL', 'GLUCOSE_FASTING'
  standardName: string | null;      // e.g., 'LDL Cholesterol'
  // Converted value in standard unit
  standardValue: number | null;
  standardUnit: string | null;      // e.g., 'mg/dL'
  // Reference range (gender-specific)
  referenceMin: number | null;
  referenceMax: number | null;
  // Computed flag
  flag: 'high' | 'low' | 'normal' | null;
  // Match status
  matched: boolean;
  // Validation issues (if any)
  validationIssues?: string[];
}
```

### Extraction Preview

The ExtractionPreview modal displays processed biomarkers with:
- **Matched biomarkers**: Standard name, code, converted value, reference range, flag
- **Unmatched biomarkers**: Highlighted with amber, original values preserved
- **Summary bar**: Count of matched vs unmatched
- **Warning notice**: When unmatched biomarkers need review

### Debug Tab

The ExtractionPreview modal includes a Debug Info tab for troubleshooting extraction issues:

| Component | Path | Description |
|-----------|------|-------------|
| DebugTab | `src/components/labUpload/DebugTab.tsx` | Main debug tab container |
| DebugSummary | `src/components/labUpload/DebugSummary.tsx` | Quick stats (total time, counts) |
| StageTimeline | `src/components/labUpload/StageTimeline.tsx` | Stage-by-stage timing breakdown |
| MatchDetailsTable | `src/components/labUpload/MatchDetailsTable.tsx` | Per-biomarker match results |
| RawResponseSection | `src/components/labUpload/RawResponseSection.tsx` | Expandable raw AI responses |

**Debug Info Captured:**

| Stage | Data Captured |
|-------|---------------|
| Gemini Extraction | Raw response, duration, biomarker count |
| GPT Verification | Raw response, duration, corrections made |
| Post-Processing | Raw response, duration, match details with conversion factors |

---

## Biomarker Standards Database

### Table: biomarker_standards

~100 common biomarkers with:
- Code (unique identifier)
- Display name and aliases
- Category (metabolic, lipid_panel, cbc, liver, kidney, etc.)
- Standard unit (US conventional)
- Unit conversion factors
- Gender-specific reference ranges
- Description and interpretation guide

### BiomarkersPage

A reference browser at `/biomarkers` allowing users to:
- Browse all biomarkers by category
- Search by name, code, or alias
- View reference ranges and descriptions

---

## Related Documents

- /docs/features/DATA_TRACKING.md — Lab Result event type details
- /docs/features/USER_PROFILE.md — User profile for gender-specific ranges
- /docs/architecture/AI_INTEGRATION.md — AI extraction pipeline
- /docs/architecture/DATABASE_SCHEMA.md — Database models
