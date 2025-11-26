# Data Tracking Feature

> Last Updated: 2025-11-26

## Summary

Comprehensive data tracking for all health event types. Covers the five event categories (lab results, doctor visits, medications, interventions, metrics), their fields, validation rules, and entry forms.

## Keywords

`events` `tracking` `biomarkers` `bloodwork` `medications` `interventions` `metrics` `forms` `validation`

## Table of Contents

- [Event Types Overview](#event-types-overview)
- [Lab Results](#lab-results)
- [Doctor Visits](#doctor-visits)
- [Medications](#medications)
- [Interventions](#interventions)
- [Metrics](#metrics)
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

---

## Lab Results

### Purpose

Track bloodwork and lab tests with individual biomarker values. Automatically flag values outside reference ranges.

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| date | Yes | Date of blood draw |
| title | Yes | Test name (e.g., "Annual Bloodwork") |
| labName | No | Lab facility name |
| orderingDoctor | No | Doctor who ordered test |
| biomarkers | Yes (1+) | Array of biomarker readings |
| notes | No | Additional notes |

### Biomarker Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Biomarker name (e.g., "LDL Cholesterol") |
| value | Yes | Numeric result |
| unit | Yes | Unit of measurement |
| referenceMin | No | Lower bound of normal range |
| referenceMax | No | Upper bound of normal range |

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

---

## Related Documents

- /docs/architecture/DATABASE_SCHEMA.md — Data models
- /docs/features/TIMELINE.md — How events display
- /docs/development/COMPONENT_LIBRARY.md — Form components
