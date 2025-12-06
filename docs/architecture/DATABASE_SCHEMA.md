# Database Schema

> Last Updated: 2025-11-26

## Summary

Data models and database structure for Digital Medical Twin. Defines all entities, relationships, and field specifications. Reference this when working with data persistence.

## Keywords

`database` `schema` `models` `entities` `storage` `cloud` `data`

## Table of Contents

- [Entity Overview](#entity-overview)
- [User Model](#user-model)
- [Event Models](#event-models)
- [Relationships](#relationships)
- [Indexes](#indexes)

---

## Entity Overview

| Entity | Purpose |
|--------|---------|
| User | User account and preferences |
| Event | Base health event (abstract) |
| LabResult | Bloodwork and lab tests |
| DoctorVisit | Clinical encounters |
| Medication | Medications and supplements |
| Intervention | Lifestyle changes and biohacks |
| Metric | Wearable and manual metrics |
| Document | Stored health documents (PDFs, images) |

---

## User Model

```typescript
interface User {
  id: string;                    // UUID
  username: string;              // Unique, for login
  passwordHash: string;          // Hashed password
  email?: string;                // Optional email
  createdAt: Date;
  updatedAt: Date;
  settings: UserSettings;
}

interface UserSettings {
  aiProvider: 'openai' | 'google';
  aiModel: string;
  apiKey?: string;               // Encrypted
  theme: 'light' | 'dark' | 'system';
}
```

---

## Event Models

### Base Event

All events inherit from this base:

```typescript
interface BaseEvent {
  id: string;                    // UUID
  userId: string;                // Foreign key to User
  type: EventType;               // Discriminator
  date: Date;                    // When event occurred
  title: string;                 // Short description
  notes?: string;                // Free-text notes
  tags?: string[];               // User-defined tags
  createdAt: Date;
  updatedAt: Date;
}

type EventType = 'lab_result' | 'doctor_visit' | 'medication' | 'intervention' | 'metric';
```

### Lab Result

```typescript
interface LabResult extends BaseEvent {
  type: 'lab_result';
  labName?: string;              // Lab facility
  orderingDoctor?: string;
  biomarkers: Biomarker[];
}

interface Biomarker {
  name: string;                  // e.g., "LDL Cholesterol"
  value: number;
  unit: string;                  // e.g., "mg/dL"
  referenceMin?: number;
  referenceMax?: number;
  flag?: 'high' | 'low' | 'normal';
}
```

### Doctor Visit

```typescript
interface DoctorVisit extends BaseEvent {
  type: 'doctor_visit';
  doctorName: string;
  specialty?: string;            // e.g., "Cardiology"
  facility?: string;
  diagnosis?: string[];
  followUp?: string;
}
```

### Medication

```typescript
interface Medication extends BaseEvent {
  type: 'medication';
  medicationName: string;
  dosage: string;                // e.g., "500mg"
  frequency: string;             // e.g., "twice daily"
  prescriber?: string;
  reason?: string;
  startDate: Date;
  endDate?: Date;                // Null if ongoing
  sideEffects?: string[];
}
```

### Intervention

```typescript
interface Intervention extends BaseEvent {
  type: 'intervention';
  interventionName: string;
  category: InterventionCategory;
  startDate: Date;
  endDate?: Date;                // Null if ongoing
  protocol?: string;             // Details of the intervention
}

type InterventionCategory = 'diet' | 'exercise' | 'supplement' | 'sleep' | 'stress' | 'other';
```

### Metric

```typescript
interface Metric extends BaseEvent {
  type: 'metric';
  source: MetricSource;
  metricName: string;            // e.g., "HRV", "Sleep Score"
  value: number;
  unit?: string;
}

type MetricSource = 'whoop' | 'oura' | 'apple_health' | 'garmin' | 'manual';
```

### Document

```typescript
interface Document {
  id: string;                    // UUID
  userId: string;                // References User
  filename: string;              // Original filename
  storagePath: string;           // Path in Supabase storage
  fileSize: number;              // Size in bytes
  mimeType: string;              // MIME type (application/pdf, image/*)
  category: DocumentCategory;
  title?: string;                // Optional display title
  description?: string;          // Optional notes
  documentDate?: Date;           // Date of the document
  labUploadId?: string;          // Links to lab_uploads if sent for extraction
  createdAt: Date;
  updatedAt: Date;
}

type DocumentCategory =
  | 'labs'
  | 'prescriptions'
  | 'imaging'
  | 'discharge_summaries'
  | 'insurance'
  | 'referrals'
  | 'other';
```

---

## Relationships

```
User (1) ──────< (many) Event
  │
  ├── Settings (embedded)
  │
  └────< (many) Document ────> (optional) LabUpload

Event (abstract)
  ├── LabResult ──────< (many) Biomarker (embedded)
  ├── DoctorVisit
  ├── Medication
  ├── Intervention
  └── Metric
```

---

## Indexes

| Collection | Index | Purpose |
|------------|-------|---------|
| users | username (unique) | Login lookup |
| events | userId, date (compound) | Timeline queries |
| events | userId, type | Filter by event type |
| events | userId, tags | Tag-based search |
| documents | userId | User's documents |
| documents | userId, category | Filter by category |
| documents | labUploadId | Track extraction links |

---

## Related Documents

- /docs/features/DATA_TRACKING.md — Event type details and validation
- /docs/features/DOCUMENTS.md — Document storage feature
- /docs/development/API_CONTRACTS.md — API endpoints for data access
