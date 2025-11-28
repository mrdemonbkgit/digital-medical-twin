# Feature Ideas (GPT-5.1)

> Last Updated: 2025-11-28

## Summary

New feature concepts for Digital Medical Twin, grounded in current product scope and personal health record best practices. Ideas focus on rounding out clinical completeness (allergies, immunizations, procedures), improving data sharing, deepening experiment analysis, and capturing daily observations to strengthen AI insights. Each idea lists rationale, scope notes, and suggested implementation touchpoints in the existing codebase.

## Keywords

`ideas` `features` `allergies` `immunizations` `procedures` `share` `experiments` `observations` `imports`

## Table of Contents

- [High-Impact Ideas](#high-impact-ideas)
  - [Allergies, Immunizations, Procedures](#allergies-immunizations-procedures)
  - [Care-Team Share Packs](#care-team-share-packs)
  - [Experiment and Outcome Tracking](#experiment-and-outcome-tracking)
  - [Observations of Daily Living](#observations-of-daily-living)
  - [FHIR and Portal Imports](#fhir-and-portal-imports)
  - [Medication Safety and Follow-ups](#medication-safety-and-follow-ups)

---

## High-Impact Ideas

### Allergies, Immunizations, Procedures

- **Why:** PHR best practices emphasize capturing allergies (reactions/severity), immunizations (doses/next due), and procedures/imaging—currently missing from the five event types.
- **What:** Add three event types with tailored fields and validation; render distinct card badges and form presets.
- **Where:** Extend `src/types/events.ts`, `src/api/events.ts`, event forms under `src/components/event/forms/`, UI cards, and filters; add colors to timeline legend.

### Care-Team Share Packs

- **Why:** Users need rapid, safe handoffs for doctors and emergencies; builds on existing export.
- **What:** One-click “Doctor packet” and “Emergency card” exports with redaction presets (hide notes/tags), optional short-lived share link.
- **Where:** Leverage `src/hooks/useExportEvents.ts`, `src/lib/exportData.ts`; add serverless handler under `api/` to mint time-bound links; surface actions in Timeline/Settings.

### Experiment and Outcome Tracking

- **Why:** Users run n=1 interventions; automate before/after comparisons to answer “did this help?”
- **What:** Let users mark an intervention/medication as an experiment with start/end; auto-pull nearby metrics/labs, compute deltas, and feed structured context to AI Historian.
- **Where:** Add experiment metadata to event schema; small analytics helper; update `src/lib/ai/retriever.ts` and `api/ai/chat.ts` context formatting; UI badges on EventCard.

### Observations of Daily Living

- **Why:** Daily energy, mood, pain, and sleep quality provide trend signals missing from episodic events.
- **What:** Quick-add daily check-ins with 1–5 sliders and optional notes; streak view and filters.
- **Where:** New lightweight event subtype or metric template; add fast entry in Timeline page; include in search/filters and AI context.

### FHIR and Portal Imports

- **Why:** Reduce manual entry/PDF reliance; align with PHR standards for tethered imports.
- **What:** Allow users to upload CCD/FHIR bundles for labs/meds/immunizations/procedures; map into existing event shapes with validation and preview.
- **Where:** Extend `src/hooks/useImportEvents.ts` + `src/lib/importData.ts` with a FHIR parser; reuse import preview UI; consider background jobs if files are large.

### Medication Safety and Follow-ups

- **Why:** Safety and adherence drive trust; complements new allergies data.
- **What:** Detect conflicts (med ↔ allergy), show interaction warnings, prompt refills or follow-up visits; pre-visit checklist on doctor visit cards.
- **Where:** Add a ruleset in a new helper (e.g., `src/lib/medicationSafety.ts`); surface warnings in `src/components/event/EventCard.tsx`; optional reminders in Settings.
