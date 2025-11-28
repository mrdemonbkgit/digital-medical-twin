import { supabase } from '@/lib/supabase';
import type {
  UserProfile,
  UserProfileRow,
  CreateUserProfileInput,
  UpdateUserProfileInput,
} from '@/types';

// Convert database row to typed UserProfile
function rowToUserProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name || undefined,
    gender: row.gender,
    dateOfBirth: row.date_of_birth,
    heightCm: row.height_cm || undefined,
    weightKg: row.weight_kg || undefined,
    medicalConditions: row.medical_conditions || [],
    currentMedications: row.current_medications || [],
    allergies: row.allergies || [],
    surgicalHistory: row.surgical_history || [],
    familyHistory: row.family_history || {},
    smokingStatus: row.smoking_status || undefined,
    alcoholFrequency: row.alcohol_frequency || undefined,
    exerciseFrequency: row.exercise_frequency || undefined,
    profileComplete: row.profile_complete,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert create input to database row format
function createInputToRow(
  input: CreateUserProfileInput,
  userId: string
): Omit<UserProfileRow, 'id' | 'created_at' | 'updated_at' | 'profile_complete'> {
  return {
    user_id: userId,
    display_name: input.displayName || null,
    gender: input.gender,
    date_of_birth: input.dateOfBirth,
    height_cm: input.heightCm || null,
    weight_kg: input.weightKg || null,
    medical_conditions: input.medicalConditions || [],
    current_medications: input.currentMedications || [],
    allergies: input.allergies || [],
    surgical_history: input.surgicalHistory || [],
    family_history: input.familyHistory || {},
    smoking_status: input.smokingStatus || null,
    alcohol_frequency: input.alcoholFrequency || null,
    exercise_frequency: input.exerciseFrequency || null,
  };
}

// Convert update input to partial database row
function updateInputToRow(input: UpdateUserProfileInput): Partial<UserProfileRow> {
  const row: Partial<UserProfileRow> = {};

  if (input.displayName !== undefined) row.display_name = input.displayName;
  if (input.gender !== undefined) row.gender = input.gender;
  if (input.dateOfBirth !== undefined) row.date_of_birth = input.dateOfBirth;
  if (input.heightCm !== undefined) row.height_cm = input.heightCm;
  if (input.weightKg !== undefined) row.weight_kg = input.weightKg;
  if (input.medicalConditions !== undefined) row.medical_conditions = input.medicalConditions;
  if (input.currentMedications !== undefined) row.current_medications = input.currentMedications;
  if (input.allergies !== undefined) row.allergies = input.allergies;
  if (input.surgicalHistory !== undefined) row.surgical_history = input.surgicalHistory;
  if (input.familyHistory !== undefined) row.family_history = input.familyHistory;
  if (input.smokingStatus !== undefined) row.smoking_status = input.smokingStatus;
  if (input.alcoholFrequency !== undefined) row.alcohol_frequency = input.alcoholFrequency;
  if (input.exerciseFrequency !== undefined) row.exercise_frequency = input.exerciseFrequency;
  if (input.profileComplete !== undefined) row.profile_complete = input.profileComplete;

  return row;
}

// Get the current user's profile
export async function getUserProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No profile found
    }
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  return rowToUserProfile(data as UserProfileRow);
}

// Create a new user profile
export async function createUserProfile(input: CreateUserProfileInput): Promise<UserProfile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const row = createInputToRow(input, user.id);

  const { data, error } = await supabase
    .from('user_profiles')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user profile: ${error.message}`);
  }

  return rowToUserProfile(data as UserProfileRow);
}

// Update the current user's profile
export async function updateUserProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const row = updateInputToRow(input);

  const { data, error } = await supabase
    .from('user_profiles')
    .update(row)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }

  return rowToUserProfile(data as UserProfileRow);
}

// Create or update user profile (upsert)
export async function upsertUserProfile(input: CreateUserProfileInput): Promise<UserProfile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if profile exists
  const existing = await getUserProfile();

  if (existing) {
    // Update existing profile
    return updateUserProfile(input);
  } else {
    // Create new profile
    return createUserProfile(input);
  }
}

// Delete the current user's profile
export async function deleteUserProfile(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete user profile: ${error.message}`);
  }
}

// Mark profile as complete
export async function markProfileComplete(): Promise<UserProfile> {
  return updateUserProfile({ profileComplete: true });
}

// Check if current user has a complete profile
export async function hasCompleteProfile(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.profileComplete ?? false;
}
