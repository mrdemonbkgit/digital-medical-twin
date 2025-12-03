# Data Tracking Feature

> Last Updated: 2025-12-03

## Summary

Comprehensive data tracking for all health event types. Covers the six event categories (lab results, doctor visits, medications, interventions, metrics, vice), their fields, validation rules, and entry forms.

## Keywords

`events` `tracking` `biomarkers` `bloodwork` `medications` `interventions` `metrics` `vice` `privacy` `forms` `validation` `tags` `presets`

## Table of Contents

- [Event Types Overview](#event-types-overview)
- [Lab Results](#lab-results)
- [Doctor Visits](#doctor-visits)
- [Medications](#medications)
- [Interventions](#interventions)
- [Metrics](#metrics)
- [Vice (Private)](#vice-private)
- [Tags System](#tags-system)
- [Biomarker Presets](#biomarker-presets)
- [Event Forms](#event-forms)
- [Validation Rules](#validation-rules)

---

## Event Types Overview

| Type | Purpose | Color |
|------|---------|-------|
| Lab Result | Bloodwork, tests, biomarkers | Red |
| Doctor Visit | Clinical encounters, diagnoses | Blue |
| Medication | Drugs, supplements, dosages | Green |
| Intervention | Lifestyle changes, biohacks | Amber |
| Metric | Wearable data, manual measurements | Purple |
| Vice | Privacy-sensitive behaviors | Slate |

---

## Lab Results

### Purpose

Track bloodwork and lab tests with individual biomarker values. Automatically flag values outside reference ranges. Supports PDF upload with AI-powered data extraction.

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| date | Yes | Date of blood draw |
| title | Yes | Test name (e.g., "Annual Bloodwork") |
| clientName | No | Patient name (from PDF extraction) |
| clientGender | No | Patient gender (male/female/other) |
| clientBirthday | No | Patient date of birth |
| labName | No | Lab facility name |
| orderingDoctor | No | Doctor who ordered test |
| biomarkers | Yes (1+) | Array of biomarker readings |
| attachments | No | PDF attachments (max 1) |
| notes | No | Additional notes |

### PDF Upload & AI Extraction

Lab result PDFs can be uploaded via the dedicated **Lab Uploads** page (`/lab-uploads`) for asynchronous AI-powered extraction. This is the recommended approach for handling potentially long-running extractions.

**See:** /docs/features/LAB_UPLOADS.md for full details.

**Quick Summary:**
1. Upload PDF at `/lab-uploads` (drag & drop)
2. Optional: Skip GPT verification for faster results
3. Extraction runs in background
4. Click "Create Event" when complete to open pre-filled form

The two-stage AI pipeline:
1. **Stage 1 - Extraction:** Gemini 3 Pro (thinking: high) analyzes the PDF
2. **Stage 2 - Verification:** GPT-5.1 (reasoning: high) verifies and corrects (optional)

### Extraction Fields

The AI extracts the following fields from lab PDFs:

| Field | Auto-Extracted |
|-------|----------------|
| Patient Name | Yes |
| Patient Gender | Yes |
| Patient Birthday | Yes |
| Lab Name | Yes |
| Ordering Doctor | Yes |
| Test Date | Yes |
| All Biomarkers | Yes (name, value, unit, reference range, flag) |

### Biomarker Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Biomarker name in English (e.g., "LDL Cholesterol") |
| value | Yes | Numeric result |
| unit | Yes | Primary unit of measurement |
| secondaryValue | No | Alternative value in different unit (e.g., mmol/L equivalent) |
| secondaryUnit | No | Alternative unit of measurement |
| referenceMin | No | Lower bound of normal range |
| referenceMax | No | Upper bound of normal range |

### Biomarker Name Translation

All biomarker names are automatically translated to standard English medical terminology during PDF extraction. This ensures consistency regardless of the source language.

| Source Language | English Standard |
|-----------------|------------------|
| Cholesterol toàn phần | Total Cholesterol |
| Đường huyết | Glucose |
| Hồng cầu | RBC |
| Bạch cầu | WBC |
| Triglycerid | Triglycerides |

### Common Biomarkers

**Lipid Panel:** Total Cholesterol, LDL, HDL, Triglycerides

**Metabolic Panel:** Glucose, HbA1c, Insulin, Creatinine, BUN, eGFR

**Thyroid:** TSH, T3, T4, Free T3, Free T4

**Hormones:** Testosterone, Estrogen, Cortisol, DHEA-S

**Vitamins:** Vitamin D, B12, Folate, Iron, Ferritin

**Inflammation:** CRP, ESR, Homocysteine

---

## Doctor Visits

### Purpose

Record clinical encounters including diagnoses, advice, and follow-up plans.

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| date | Yes | Date of visit |
| title | Yes | Visit description |
| doctorName | Yes | Provider name |
| specialty | No | Medical specialty |
| facility | No | Clinic/hospital name |
| diagnosis | No | Diagnosis codes or descriptions |
| notes | No | Visit notes, advice given |
| followUp | No | Follow-up instructions |

### Common Specialties

Cardiology, Endocrinology, Gastroenterology, Neurology, Dermatology, Primary Care, Orthopedics, Rheumatology, Pulmonology, Oncology

---

## Medications

### Purpose

Track medications and supplements with dosages, frequencies, and date ranges.

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| date | Yes | Date added to timeline |
| title | Yes | Auto-generated from medication name |
| medicationName | Yes | Drug or supplement name |
| dosage | Yes | Amount (e.g., "500mg") |
| frequency | Yes | How often (e.g., "twice daily") |
| startDate | Yes | When started taking |
| endDate | No | When stopped (null if ongoing) |
| prescriber | No | Prescribing doctor |
| reason | No | Why prescribed/taken |
| sideEffects | No | Observed side effects |

### Frequency Options

- Once daily
- Twice daily
- Three times daily
- Every other day
- Weekly
- As needed
- Custom

---

## Interventions

### Purpose

Track lifestyle changes and biohacks that traditional medical records ignore. Critical for correlation analysis.

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| date | Yes | Date added to timeline |
| title | Yes | Auto-generated from intervention name |
| interventionName | Yes | What was changed |
| category | Yes | Type of intervention |
| startDate | Yes | When started |
| endDate | No | When stopped (null if ongoing) |
| protocol | No | Detailed description |
| notes | No | Observations, outcomes |

### Categories

| Category | Examples |
|----------|----------|
| Diet | Keto, Intermittent Fasting, Elimination Diet |
| Exercise | Started running, Zone 2 cardio, Strength training |
| Supplement | New supplement not prescribed |
| Sleep | Changed sleep schedule, Blue light blocking |
| Stress | Started meditation, Breathwork |
| Other | Cold exposure, Sauna, Grounding |

---

## Metrics

### Purpose

Import or manually log data from wearables and measurements.

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| date | Yes | Date of measurement |
| title | Yes | Auto-generated from metric name |
| source | Yes | Where data came from |
| metricName | Yes | What was measured |
| value | Yes | Numeric value |
| unit | No | Unit of measurement |
| notes | No | Additional context |

### Sources

- Whoop
- Oura
- Apple Health
- Garmin
- Manual

### Common Metrics

| Metric | Unit | Source |
|--------|------|--------|
| HRV | ms | Whoop, Oura, Apple |
| Resting Heart Rate | bpm | All |
| Sleep Score | 0-100 | Whoop, Oura |
| Recovery Score | 0-100 | Whoop |
| Readiness Score | 0-100 | Oura |
| Steps | count | All |
| Weight | lbs/kg | Manual |
| Blood Pressure | mmHg | Manual |

---

## Vice (Private)

### Purpose

Track privacy-sensitive behaviors that users want to monitor but keep private by default. Data-level privacy enforcement ensures these events are never exposed unless explicitly requested.

### Privacy Model

| Layer | Behavior |
|-------|----------|
| Database | `is_private = true` always for vice events |
| API | Excluded from `getEvents()` unless `includePrivate: true` |
| Timeline | Hidden by default; toggle to show private events |
| Export | Excluded by default |
| AI Context | Included in AI chat for correlation analysis |

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| date | Yes | Date of event |
| title | Yes | Auto-generated from category |
| viceCategory | Yes | Type of vice (see categories below) |
| quantity | No | Numeric amount |
| unit | No | Unit of measurement |
| context | No | Situational context (social, stress, etc.) |
| trigger | No | What prompted the behavior |
| notes | No | Additional notes |
| tags | No | Custom tags |

### Categories

| Category | Description | Common Units |
|----------|-------------|--------------|
| alcohol | Alcoholic beverages | drinks, units |
| masturbation | Masturbation | minutes, sessions |
| smoking | Cigarettes, vaping, tobacco | cigarettes, puffs |
| drugs | Recreational drug use | mg, hits, uses |

### Category-Specific Examples

| Category | Quantity | Unit | Context Examples |
|----------|----------|------|------------------|
| alcohol | 3 | drinks | social, dinner, stress |
| masturbation | 1 | sessions | boredom, stress |
| smoking | 5 | cigarettes | break, stress |
| drugs | 10 | mg | recreational, pain |

### Timeline Visibility

Users can toggle private event visibility on the Timeline page:
- **Default:** Private events hidden
- **Toggle:** "Show private" button reveals vice events
- **URL:** `?private=true` parameter for direct links

---

## Tags System

### Purpose

Allow users to organize events with custom labels for easier filtering and categorization. Tags persist across events and can be reused.

### Features

| Feature | Description |
|---------|-------------|
| Add Tags | Type tag name and press Enter or comma |
| Autocomplete | Suggests existing tags as you type |
| Remove Tags | Click X on tag chip to remove |
| Filter by Tags | Filter timeline to show only events with specific tags |

### Implementation

```typescript
interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}
```

### URL Filter Format

Tags are synced to URL for shareable filtered views:
```
/timeline?tags=routine,fasting
```

### Common Tag Examples

- `routine` - Regular checkups
- `fasting` - Fasting lab tests
- `follow-up` - Follow-up appointments
- `urgent` - Urgent care visits
- `specialist` - Specialist consultations

---

## Biomarker Presets

### Purpose

Speed up lab result entry by auto-populating common biomarker panels with standard names, units, and reference ranges.

### Available Presets

| Preset | Biomarkers |
|--------|------------|
| Lipid Panel | Total Cholesterol, LDL, HDL, Triglycerides, VLDL |
| Basic Metabolic Panel | Glucose, BUN, Creatinine, Sodium, Potassium, Chloride, CO2, Calcium |
| Comprehensive Metabolic Panel | BMP + ALT, AST, ALP, Bilirubin, Albumin, Total Protein |
| Complete Blood Count | WBC, RBC, Hemoglobin, Hematocrit, MCV, MCH, MCHC, RDW, Platelets |
| Thyroid Panel | TSH, Free T4, Free T3 |
| Liver Function | ALT, AST, ALP, GGT, Bilirubin (Total/Direct), Albumin |
| Iron Panel | Iron, TIBC, Ferritin, Transferrin Saturation |
| Inflammation Markers | CRP, ESR, Homocysteine |
| HbA1c | HbA1c |
| Vitamin D | 25-OH Vitamin D |

### Usage

1. Select preset from dropdown in Lab Result form
2. Biomarkers auto-populate with standard units and reference ranges
3. Enter your actual values
4. Add or remove individual biomarkers as needed

### Implementation

Presets are defined in `src/lib/biomarkerPresets.ts`:

```typescript
interface BiomarkerPreset {
  name: string;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
}

const BIOMARKER_PRESETS: Record<string, BiomarkerPreset[]>;
```

---

## Event Forms

### Form UX Principles

- Single-page form per event type
- Required fields marked clearly
- Smart defaults where possible
- Date defaults to today
- Auto-save drafts

### Biomarker Entry

For lab results, support two entry modes:

1. **Quick Entry:** Select from common biomarker presets
2. **Manual Entry:** Add custom biomarker name/value/unit

---

## Validation Rules

### All Events

| Field | Rule |
|-------|------|
| date | Must be valid date, not in future |
| title | 1-200 characters |
| notes | Max 5000 characters |

### Biomarkers

| Field | Rule |
|-------|------|
| name | 1-100 characters |
| value | Positive number |
| unit | 1-20 characters |
| referenceMin | Must be less than referenceMax |

### Medications

| Field | Rule |
|-------|------|
| startDate | Must be before or equal to endDate |
| endDate | Must be after startDate |

### Vice

| Field | Rule |
|-------|------|
| viceCategory | Required, must be one of: alcohol, pornography, smoking, drugs |
| quantity | Optional, positive number |
| unit | Optional, 1-50 characters |

---

## Related Documents

- /docs/architecture/DATABASE_SCHEMA.md — Data models
- /docs/features/TIMELINE.md — How events display
- /docs/development/COMPONENT_LIBRARY.md — Form components
