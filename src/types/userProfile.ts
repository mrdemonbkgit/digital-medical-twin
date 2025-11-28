// User Profile Types

export type Gender = 'male' | 'female' | 'other';
export type SmokingStatus = 'never' | 'former' | 'current';
export type AlcoholFrequency = 'never' | 'occasional' | 'moderate' | 'heavy';
export type ExerciseFrequency = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

// Family history: maps condition to array of relatives
// e.g., { "heart_disease": ["father"], "diabetes": ["mother", "grandmother"] }
export type FamilyHistory = Record<string, string[]>;

// Common family history conditions for UI
export const FAMILY_HISTORY_CONDITIONS = [
  'heart_disease',
  'diabetes',
  'cancer',
  'hypertension',
  'stroke',
  'alzheimers',
  'asthma',
  'arthritis',
  'kidney_disease',
  'liver_disease',
  'thyroid_disorder',
  'mental_health',
] as const;

export type FamilyHistoryCondition = typeof FAMILY_HISTORY_CONDITIONS[number];

// Relatives for family history
export const RELATIVES = [
  'father',
  'mother',
  'brother',
  'sister',
  'grandfather_paternal',
  'grandmother_paternal',
  'grandfather_maternal',
  'grandmother_maternal',
] as const;

export type Relative = typeof RELATIVES[number];

// Main UserProfile interface
export interface UserProfile {
  id: string;
  userId: string;

  // Basic Info
  displayName?: string;
  gender: Gender;
  dateOfBirth: string; // ISO date string (YYYY-MM-DD)
  heightCm?: number;
  weightKg?: number;

  // Medical History
  medicalConditions: string[];
  currentMedications: string[];
  allergies: string[];
  surgicalHistory: string[];

  // Family History
  familyHistory: FamilyHistory;

  // Lifestyle
  smokingStatus?: SmokingStatus;
  alcoholFrequency?: AlcoholFrequency;
  exerciseFrequency?: ExerciseFrequency;

  // Metadata
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// Database row shape (snake_case)
export interface UserProfileRow {
  id: string;
  user_id: string;
  display_name: string | null;
  gender: Gender;
  date_of_birth: string;
  height_cm: number | null;
  weight_kg: number | null;
  medical_conditions: string[];
  current_medications: string[];
  allergies: string[];
  surgical_history: string[];
  family_history: FamilyHistory;
  smoking_status: SmokingStatus | null;
  alcohol_frequency: AlcoholFrequency | null;
  exercise_frequency: ExerciseFrequency | null;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

// Input for creating a new profile
export interface CreateUserProfileInput {
  displayName?: string;
  gender: Gender;
  dateOfBirth: string;
  heightCm?: number;
  weightKg?: number;
  medicalConditions?: string[];
  currentMedications?: string[];
  allergies?: string[];
  surgicalHistory?: string[];
  familyHistory?: FamilyHistory;
  smokingStatus?: SmokingStatus;
  alcoholFrequency?: AlcoholFrequency;
  exerciseFrequency?: ExerciseFrequency;
}

// Input for updating an existing profile
export interface UpdateUserProfileInput {
  displayName?: string | null;
  gender?: Gender;
  dateOfBirth?: string;
  heightCm?: number | null;
  weightKg?: number | null;
  medicalConditions?: string[];
  currentMedications?: string[];
  allergies?: string[];
  surgicalHistory?: string[];
  familyHistory?: FamilyHistory;
  smokingStatus?: SmokingStatus | null;
  alcoholFrequency?: AlcoholFrequency | null;
  exerciseFrequency?: ExerciseFrequency | null;
  profileComplete?: boolean;
}

// Helper function to calculate age from date of birth
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Helper function to calculate BMI
export function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

// Helper function to get BMI category
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}
