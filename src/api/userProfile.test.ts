import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  upsertUserProfile,
  deleteUserProfile,
  markProfileComplete,
  hasCompleteProfile,
} from './userProfile';
import type { UserProfileRow, CreateUserProfileInput, UpdateUserProfileInput } from '@/types';

// Mock supabase
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

const mockUserId = 'user-123';

// Sample user profile row (database format - snake_case)
const mockUserProfileRow: UserProfileRow = {
  id: 'profile-1',
  user_id: mockUserId,
  display_name: 'John Doe',
  gender: 'male',
  date_of_birth: '1990-01-15',
  height_cm: 180,
  weight_kg: 75,
  medical_conditions: ['hypertension'],
  current_medications: ['lisinopril'],
  allergies: ['penicillin'],
  surgical_history: ['appendectomy'],
  family_history: { diabetes: true },
  smoking_status: 'never',
  alcohol_frequency: 'occasional',
  exercise_frequency: 'regular',
  profile_complete: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

const mockIncompleteProfileRow: UserProfileRow = {
  ...mockUserProfileRow,
  id: 'profile-2',
  profile_complete: false,
  display_name: null,
  height_cm: null,
  weight_kg: null,
  medical_conditions: [],
  current_medications: [],
  allergies: [],
  surgical_history: [],
  family_history: {},
  smoking_status: null,
  alcohol_frequency: null,
  exercise_frequency: null,
};

describe('userProfile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock setup - user is authenticated
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Setup Supabase query chain mocks
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    });

    mockUpdate.mockReturnValue({
      eq: mockEq,
    });

    mockDelete.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
    });
  });

  describe('getUserProfile', () => {
    it('fetches profile for authenticated user', async () => {
      mockSingle.mockResolvedValue({
        data: mockUserProfileRow,
        error: null,
      });

      const result = await getUserProfile();

      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(result).toEqual({
        id: 'profile-1',
        userId: mockUserId,
        displayName: 'John Doe',
        gender: 'male',
        dateOfBirth: '1990-01-15',
        heightCm: 180,
        weightKg: 75,
        medicalConditions: ['hypertension'],
        currentMedications: ['lisinopril'],
        allergies: ['penicillin'],
        surgicalHistory: ['appendectomy'],
        familyHistory: { diabetes: true },
        smokingStatus: 'never',
        alcoholFrequency: 'occasional',
        exerciseFrequency: 'regular',
        profileComplete: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      });
    });

    it('returns null when no profile exists (PGRST116)', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      const result = await getUserProfile();

      expect(result).toBeNull();
    });

    it('throws error on authentication failure', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getUserProfile()).rejects.toThrow('User not authenticated');
    });

    it('throws error on database error (non-PGRST116)', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'SOME_ERROR', message: 'Database error' },
      });

      await expect(getUserProfile()).rejects.toThrow(
        'Failed to fetch user profile: Database error'
      );
    });

    it('transforms snake_case to camelCase correctly', async () => {
      mockSingle.mockResolvedValue({
        data: mockUserProfileRow,
        error: null,
      });

      const result = await getUserProfile();

      expect(result).not.toBeNull();
      expect(result!.userId).toBe(mockUserId);
      expect(result!.displayName).toBe('John Doe');
      expect(result!.dateOfBirth).toBe('1990-01-15');
      expect(result!.heightCm).toBe(180);
      expect(result!.weightKg).toBe(75);
      expect(result!.medicalConditions).toEqual(['hypertension']);
      expect(result!.currentMedications).toEqual(['lisinopril']);
      expect(result!.surgicalHistory).toEqual(['appendectomy']);
      expect(result!.familyHistory).toEqual({ diabetes: true });
      expect(result!.smokingStatus).toBe('never');
      expect(result!.alcoholFrequency).toBe('occasional');
      expect(result!.exerciseFrequency).toBe('regular');
      expect(result!.profileComplete).toBe(true);
      expect(result!.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(result!.updatedAt).toBe('2024-01-15T00:00:00Z');
    });

    it('handles null optional fields correctly', async () => {
      mockSingle.mockResolvedValue({
        data: mockIncompleteProfileRow,
        error: null,
      });

      const result = await getUserProfile();

      expect(result).not.toBeNull();
      expect(result!.displayName).toBeUndefined();
      expect(result!.heightCm).toBeUndefined();
      expect(result!.weightKg).toBeUndefined();
      expect(result!.medicalConditions).toEqual([]);
      expect(result!.smokingStatus).toBeUndefined();
      expect(result!.alcoholFrequency).toBeUndefined();
      expect(result!.exerciseFrequency).toBeUndefined();
    });
  });

  describe('createUserProfile', () => {
    it('creates profile with all fields', async () => {
      mockSingle.mockResolvedValue({
        data: mockUserProfileRow,
        error: null,
      });

      const input: CreateUserProfileInput = {
        displayName: 'John Doe',
        gender: 'male',
        dateOfBirth: '1990-01-15',
        heightCm: 180,
        weightKg: 75,
        medicalConditions: ['hypertension'],
        currentMedications: ['lisinopril'],
        allergies: ['penicillin'],
        surgicalHistory: ['appendectomy'],
        familyHistory: { diabetes: true },
        smokingStatus: 'never',
        alcoholFrequency: 'occasional',
        exerciseFrequency: 'regular',
      };

      const result = await createUserProfile(input);

      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          display_name: 'John Doe',
          gender: 'male',
          date_of_birth: '1990-01-15',
          height_cm: 180,
          weight_kg: 75,
          medical_conditions: ['hypertension'],
          current_medications: ['lisinopril'],
          allergies: ['penicillin'],
          surgical_history: ['appendectomy'],
          family_history: { diabetes: true },
          smoking_status: 'never',
          alcohol_frequency: 'occasional',
          exercise_frequency: 'regular',
        })
      );
      expect(result.userId).toBe(mockUserId);
    });

    it('creates profile with minimal required fields', async () => {
      mockSingle.mockResolvedValue({
        data: mockIncompleteProfileRow,
        error: null,
      });

      const input: CreateUserProfileInput = {
        gender: 'female',
        dateOfBirth: '1995-06-20',
      };

      await createUserProfile(input);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          gender: 'female',
          date_of_birth: '1995-06-20',
          display_name: null,
          height_cm: null,
          weight_kg: null,
          medical_conditions: [],
          current_medications: [],
          allergies: [],
          surgical_history: [],
          family_history: {},
          smoking_status: null,
          alcohol_frequency: null,
          exercise_frequency: null,
        })
      );
    });

    it('throws error on authentication failure', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const input: CreateUserProfileInput = {
        gender: 'male',
        dateOfBirth: '1990-01-15',
      };

      await expect(createUserProfile(input)).rejects.toThrow('User not authenticated');
    });

    it('throws error on database error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Duplicate key violation' },
      });

      const input: CreateUserProfileInput = {
        gender: 'male',
        dateOfBirth: '1990-01-15',
      };

      await expect(createUserProfile(input)).rejects.toThrow(
        'Failed to create user profile: Duplicate key violation'
      );
    });
  });

  describe('updateUserProfile', () => {
    it('updates profile with partial fields', async () => {
      const updatedRow = { ...mockUserProfileRow, display_name: 'Jane Doe' };
      mockEq.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: updatedRow,
            error: null,
          }),
        }),
      });

      const input: UpdateUserProfileInput = {
        displayName: 'Jane Doe',
      };

      const result = await updateUserProfile(input);

      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(mockUpdate).toHaveBeenCalledWith({ display_name: 'Jane Doe' });
      expect(result.displayName).toBe('Jane Doe');
    });

    it('only includes provided fields in update', async () => {
      mockEq.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUserProfileRow,
            error: null,
          }),
        }),
      });

      const input: UpdateUserProfileInput = {
        heightCm: 175,
        weightKg: 70,
      };

      await updateUserProfile(input);

      expect(mockUpdate).toHaveBeenCalledWith({
        height_cm: 175,
        weight_kg: 70,
      });
    });

    it('updates all fields when provided', async () => {
      mockEq.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUserProfileRow,
            error: null,
          }),
        }),
      });

      const input: UpdateUserProfileInput = {
        displayName: 'Updated Name',
        gender: 'female',
        dateOfBirth: '1992-03-25',
        heightCm: 165,
        weightKg: 60,
        medicalConditions: ['asthma'],
        currentMedications: ['albuterol'],
        allergies: ['shellfish'],
        surgicalHistory: ['tonsillectomy'],
        familyHistory: { cancer: true },
        smokingStatus: 'former',
        alcoholFrequency: 'never',
        exerciseFrequency: 'occasional',
        profileComplete: true,
      };

      await updateUserProfile(input);

      expect(mockUpdate).toHaveBeenCalledWith({
        display_name: 'Updated Name',
        gender: 'female',
        date_of_birth: '1992-03-25',
        height_cm: 165,
        weight_kg: 60,
        medical_conditions: ['asthma'],
        current_medications: ['albuterol'],
        allergies: ['shellfish'],
        surgical_history: ['tonsillectomy'],
        family_history: { cancer: true },
        smoking_status: 'former',
        alcohol_frequency: 'never',
        exercise_frequency: 'occasional',
        profile_complete: true,
      });
    });

    it('throws error on authentication failure', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(updateUserProfile({ displayName: 'Test' })).rejects.toThrow(
        'User not authenticated'
      );
    });

    it('throws error on database error', async () => {
      mockEq.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Update failed' },
          }),
        }),
      });

      await expect(updateUserProfile({ displayName: 'Test' })).rejects.toThrow(
        'Failed to update user profile: Update failed'
      );
    });
  });

  describe('upsertUserProfile', () => {
    it('creates profile when none exists', async () => {
      // First call: getUserProfile returns null (no profile)
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      // Second call: createUserProfile succeeds
      mockSingle.mockResolvedValueOnce({
        data: mockUserProfileRow,
        error: null,
      });

      const input: CreateUserProfileInput = {
        gender: 'male',
        dateOfBirth: '1990-01-15',
      };

      const result = await upsertUserProfile(input);

      expect(result.userId).toBe(mockUserId);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('updates profile when one exists', async () => {
      // Setup mock to handle both getUserProfile and updateUserProfile chains
      mockEq.mockImplementation(() => ({
        single: vi.fn().mockResolvedValueOnce({
          data: mockUserProfileRow,
          error: null,
        }),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockUserProfileRow, display_name: 'Updated' },
            error: null,
          }),
        }),
      }));

      const input: CreateUserProfileInput = {
        gender: 'male',
        dateOfBirth: '1990-01-15',
        displayName: 'Updated',
      };

      const result = await upsertUserProfile(input);

      expect(result.displayName).toBe('Updated');
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('throws error on authentication failure', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const input: CreateUserProfileInput = {
        gender: 'male',
        dateOfBirth: '1990-01-15',
      };

      await expect(upsertUserProfile(input)).rejects.toThrow('User not authenticated');
    });
  });

  describe('deleteUserProfile', () => {
    it('deletes profile successfully', async () => {
      mockEq.mockResolvedValue({ error: null });

      await deleteUserProfile();

      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('throws error on authentication failure', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(deleteUserProfile()).rejects.toThrow('User not authenticated');
    });

    it('throws error on database error', async () => {
      mockEq.mockResolvedValue({
        error: { message: 'Delete failed' },
      });

      await expect(deleteUserProfile()).rejects.toThrow(
        'Failed to delete user profile: Delete failed'
      );
    });
  });

  describe('markProfileComplete', () => {
    it('sets profileComplete to true', async () => {
      mockEq.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockUserProfileRow, profile_complete: true },
            error: null,
          }),
        }),
      });

      const result = await markProfileComplete();

      expect(mockUpdate).toHaveBeenCalledWith({ profile_complete: true });
      expect(result.profileComplete).toBe(true);
    });

    it('throws error on authentication failure', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(markProfileComplete()).rejects.toThrow('User not authenticated');
    });
  });

  describe('hasCompleteProfile', () => {
    it('returns true when profile is complete', async () => {
      mockSingle.mockResolvedValue({
        data: mockUserProfileRow,
        error: null,
      });

      const result = await hasCompleteProfile();

      expect(result).toBe(true);
    });

    it('returns false when profile is incomplete', async () => {
      mockSingle.mockResolvedValue({
        data: mockIncompleteProfileRow,
        error: null,
      });

      const result = await hasCompleteProfile();

      expect(result).toBe(false);
    });

    it('returns false when no profile exists', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      const result = await hasCompleteProfile();

      expect(result).toBe(false);
    });

    it('throws error on authentication failure', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(hasCompleteProfile()).rejects.toThrow('User not authenticated');
    });
  });

  describe('row transformation', () => {
    it('handles empty arrays correctly in transformation', async () => {
      const rowWithEmptyArrays: UserProfileRow = {
        ...mockUserProfileRow,
        medical_conditions: [],
        current_medications: [],
        allergies: [],
        surgical_history: [],
        family_history: {},
      };

      mockSingle.mockResolvedValue({
        data: rowWithEmptyArrays,
        error: null,
      });

      const result = await getUserProfile();

      expect(result!.medicalConditions).toEqual([]);
      expect(result!.currentMedications).toEqual([]);
      expect(result!.allergies).toEqual([]);
      expect(result!.surgicalHistory).toEqual([]);
      expect(result!.familyHistory).toEqual({});
    });

    it('handles null values as undefined for optional fields', async () => {
      const rowWithNulls: UserProfileRow = {
        ...mockUserProfileRow,
        display_name: null,
        height_cm: null,
        weight_kg: null,
        smoking_status: null,
        alcohol_frequency: null,
        exercise_frequency: null,
      };

      mockSingle.mockResolvedValue({
        data: rowWithNulls,
        error: null,
      });

      const result = await getUserProfile();

      expect(result!.displayName).toBeUndefined();
      expect(result!.heightCm).toBeUndefined();
      expect(result!.weightKg).toBeUndefined();
      expect(result!.smokingStatus).toBeUndefined();
      expect(result!.alcoholFrequency).toBeUndefined();
      expect(result!.exerciseFrequency).toBeUndefined();
    });
  });
});
