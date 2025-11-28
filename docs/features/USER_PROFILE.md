# User Profile Feature

> Last Updated: 2025-11-28

## Summary

User profile system that collects essential health information during onboarding. Profile data is required before uploading lab results and is used for gender-specific reference ranges, health context in AI analysis, and personalized insights.

## Keywords

`user profile` `onboarding` `health information` `gender` `medical history` `medications` `allergies` `family history` `lifestyle`

## Table of Contents

- [Overview](#overview)
- [User Flow](#user-flow)
- [Profile Data](#profile-data)
- [Components](#components)
- [Database Schema](#database-schema)
- [API](#api)

---

## Overview

### Problem Solved

Lab result interpretation requires user context:
- Gender for reference ranges (male vs female ranges differ)
- Medical history for AI analysis context
- Medications/supplements that may affect results
- Family history for risk assessment

### Solution

A required profile setup that:
1. Gates access to lab uploads until profile is complete
2. Collects health information via multi-step wizard
3. Stores data securely with RLS policies
4. Provides edit capability via profile page

### Key Features

| Feature | Description |
|---------|-------------|
| Profile Gate | Dashboard and Lab Uploads redirect to setup if incomplete |
| Multi-step Wizard | 6 steps collecting different categories of information |
| Auto-save Progress | Data persists as user progresses through wizard |
| Edit Mode | Full profile editing on dedicated profile page |

---

## User Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  1. New user logs in                                             │
│       - No profile exists                                        │
├──────────────────────────────────────────────────────────────────┤
│  2. Redirected to /profile/setup                                 │
│       - Multi-step wizard begins                                 │
├──────────────────────────────────────────────────────────────────┤
│  3. Complete all steps                                           │
│       - Basic Info → Conditions → Medications → Allergies        │
│       → Family History → Lifestyle                               │
├──────────────────────────────────────────────────────────────────┤
│  4. Profile saved, redirected to dashboard                       │
│       - Can now access Lab Uploads                               │
├──────────────────────────────────────────────────────────────────┤
│  5. Later: Edit profile at /profile                              │
│       - All sections editable                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Profile Data

### Step 1: Basic Information

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| gender | 'male' \| 'female' | Yes | For reference range selection |
| dateOfBirth | string (YYYY-MM-DD) | Yes | Age calculation |
| heightCm | number | No | Height in centimeters |
| weightKg | number | No | Weight in kilograms |

### Step 2: Medical Conditions

| Field | Type | Description |
|-------|------|-------------|
| conditions | string[] | Existing diagnoses (e.g., diabetes, hypertension) |

Common presets provided: Diabetes Type 1/2, Hypertension, Heart Disease, etc.

### Step 3: Medications & Supplements

| Field | Type | Description |
|-------|------|-------------|
| medications | string[] | Current medications |
| supplements | string[] | Current supplements |

### Step 4: Allergies

| Field | Type | Description |
|-------|------|-------------|
| allergies | string[] | Known allergies |

### Step 5: Family Health History

| Field | Type | Description |
|-------|------|-------------|
| familyHistory | FamilyHistoryEntry[] | Conditions in relatives |

```typescript
interface FamilyHistoryEntry {
  condition: string;  // e.g., "heart_disease"
  relatives: string[]; // e.g., ["father", "mother"]
}
```

### Step 6: Lifestyle Factors

| Field | Type | Description |
|-------|------|-------------|
| smokingStatus | 'never' \| 'former' \| 'current' | Smoking history |
| alcoholConsumption | 'none' \| 'occasional' \| 'moderate' \| 'heavy' | Drinking frequency |
| exerciseFrequency | 'sedentary' \| 'light' \| 'moderate' \| 'active' \| 'very_active' | Activity level |
| dietType | 'omnivore' \| 'vegetarian' \| 'vegan' \| 'pescatarian' \| 'keto' \| 'other' | Dietary pattern |

---

## Components

### Pages

| Component | Path | Description |
|-----------|------|-------------|
| ProfileSetupPage | `src/pages/ProfileSetupPage.tsx` | Multi-step onboarding wizard |
| ProfilePage | `src/pages/ProfilePage.tsx` | View/edit existing profile |

### Hooks

| Hook | Path | Description |
|------|------|-------------|
| useUserProfile | `src/hooks/useUserProfile.ts` | CRUD operations for profile |
| useRequireProfile | `src/hooks/useRequireProfile.ts` | Profile gate logic |
| useProfileStatus | `src/hooks/useRequireProfile.ts` | Check if profile exists |

### API

| File | Description |
|------|-------------|
| `src/api/userProfile.ts` | Client-side API functions |

---

## Database Schema

### user_profiles Table

```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  date_of_birth DATE NOT NULL,
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  conditions TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  supplements TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  family_history JSONB DEFAULT '[]',
  smoking_status TEXT CHECK (smoking_status IN ('never', 'former', 'current')),
  alcohol_consumption TEXT CHECK (alcohol_consumption IN ('none', 'occasional', 'moderate', 'heavy')),
  exercise_frequency TEXT CHECK (exercise_frequency IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  diet_type TEXT CHECK (diet_type IN ('omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### RLS Policies

| Policy | Rule |
|--------|------|
| Select | Users can only see their own profile |
| Insert | Users can only create for themselves |
| Update | Users can only update their own profile |
| Delete | Users can only delete their own profile |

---

## API

### Client API Functions

```typescript
// Get current user's profile
getUserProfile(): Promise<UserProfile | null>

// Create new profile
createUserProfile(input: CreateUserProfileInput): Promise<UserProfile>

// Update existing profile
updateUserProfile(input: UpdateUserProfileInput): Promise<UserProfile>
```

---

## Integration with Lab Uploads

The user's gender from their profile is used in:
1. **Post-processing stage**: Selecting male or female reference ranges
2. **ExtractionPreview**: Displaying appropriate reference values
3. **AI analysis**: Providing context for health insights

If no profile exists, the system falls back to gender extracted from the lab PDF.

---

## Related Documents

- /docs/features/LAB_UPLOADS.md — Lab upload processing pipeline
- /docs/architecture/DATABASE_SCHEMA.md — Database models
- /docs/architecture/AUTH_SYSTEM.md — User authentication
