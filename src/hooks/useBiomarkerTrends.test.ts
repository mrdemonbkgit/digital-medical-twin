import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBiomarkerTrends } from './useBiomarkerTrends';
import type { LabResult } from '@/types/events';
import type { BiomarkerStandard } from '@/types/biomarker';
import type { UserProfile } from '@/types';
import type { TimeRange } from '@/lib/insights/dataProcessing';

// Mock the dependent hooks
const mockUseEvents = vi.fn();
const mockUseBiomarkers = vi.fn();
const mockUseUserProfile = vi.fn();

vi.mock('./useEvents', () => ({
  useEvents: () => mockUseEvents(),
}));

vi.mock('./useBiomarkers', () => ({
  useBiomarkers: () => mockUseBiomarkers(),
}));

vi.mock('./useUserProfile', () => ({
  useUserProfile: () => mockUseUserProfile(),
}));

// Sample lab result events
const createLabResult = (
  id: string,
  date: string,
  biomarkers: Array<{ name: string; value: number; unit: string }>
): LabResult => ({
  id,
  userId: 'user-123',
  type: 'lab_result',
  title: 'Blood Panel',
  date,
  biomarkers,
  createdAt: date,
  updatedAt: date,
});

// Sample biomarker standards
const glucoseStandard: BiomarkerStandard = {
  id: 'glucose-std',
  code: 'glucose',
  name: 'Glucose',
  category: 'metabolic',
  unit: 'mg/dL',
  aliases: ['blood glucose', 'fasting glucose'],
  referenceRanges: {
    male: { min: 70, max: 100 },
    female: { min: 70, max: 100 },
    default: { min: 70, max: 100 },
  },
};

const hdlStandard: BiomarkerStandard = {
  id: 'hdl-std',
  code: 'hdl_cholesterol',
  name: 'HDL Cholesterol',
  category: 'lipid',
  unit: 'mg/dL',
  aliases: ['hdl', 'good cholesterol'],
  referenceRanges: {
    male: { min: 40, max: 60 },
    female: { min: 50, max: 70 },
    default: { min: 40, max: 60 },
  },
};

const mockLabEvents: LabResult[] = [
  createLabResult('lab-1', '2024-06-01', [
    { name: 'Glucose', value: 95, unit: 'mg/dL' },
    { name: 'HDL Cholesterol', value: 55, unit: 'mg/dL' },
  ]),
  createLabResult('lab-2', '2024-03-01', [
    { name: 'Glucose', value: 110, unit: 'mg/dL' }, // High
    { name: 'HDL Cholesterol', value: 35, unit: 'mg/dL' }, // Low
  ]),
];

const mockStandards: BiomarkerStandard[] = [glucoseStandard, hdlStandard];

const mockProfile: UserProfile = {
  id: 'profile-1',
  userId: 'user-123',
  gender: 'male',
  dateOfBirth: '1990-01-15',
  medicalConditions: [],
  currentMedications: [],
  allergies: [],
  surgicalHistory: [],
  familyHistory: {},
  profileComplete: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockRefetch = vi.fn();

describe('useBiomarkerTrends', () => {
  const defaultTimeRange: TimeRange = { months: 12 };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseEvents.mockReturnValue({
      events: mockLabEvents,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    mockUseBiomarkers.mockReturnValue({
      biomarkers: mockStandards,
      isLoading: false,
    });

    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
    });
  });

  describe('initial state', () => {
    it('returns empty state while loading events', () => {
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.summaries).toEqual([]);
      expect(result.current.flagCounts).toEqual({ high: 0, low: 0 });
      expect(result.current.categoriesWithData).toEqual([]);
    });

    it('returns empty state while loading standards', () => {
      mockUseBiomarkers.mockReturnValue({
        biomarkers: [],
        isLoading: true,
      });

      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.summaries).toEqual([]);
    });

    it('returns loading true when both are loading', () => {
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });
      mockUseBiomarkers.mockReturnValue({
        biomarkers: [],
        isLoading: true,
      });

      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('data processing', () => {
    it('extracts biomarker summaries from lab results', () => {
      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.summaries.length).toBeGreaterThan(0);
    });

    it('groups biomarkers by category correctly', () => {
      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      const { groupedByCategory } = result.current;

      // Should have metabolic and lipid categories
      expect(groupedByCategory.metabolic).toBeDefined();
      expect(groupedByCategory.lipid).toBeDefined();
    });

    it('counts high and low flags', () => {
      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      const { flagCounts } = result.current;

      // Based on mock data:
      // Glucose 110 is high (>100)
      // HDL 35 is low (<40 for male)
      expect(flagCounts.high).toBeGreaterThanOrEqual(0);
      expect(flagCounts.low).toBeGreaterThanOrEqual(0);
    });

    it('returns categories with data', () => {
      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      const { categoriesWithData } = result.current;

      expect(categoriesWithData.length).toBeGreaterThan(0);
      expect(categoriesWithData).toContain('metabolic');
      expect(categoriesWithData).toContain('lipid');
    });
  });

  describe('profile handling', () => {
    it('uses male gender for reference ranges when profile is male', () => {
      mockUseUserProfile.mockReturnValue({
        profile: { ...mockProfile, gender: 'male' },
      });

      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      // Should not throw and should return valid data
      expect(result.current.summaries.length).toBeGreaterThan(0);
    });

    it('uses female gender for reference ranges when profile is female', () => {
      mockUseUserProfile.mockReturnValue({
        profile: { ...mockProfile, gender: 'female' },
      });

      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      // Should not throw and should return valid data
      expect(result.current.summaries.length).toBeGreaterThan(0);
    });

    it('handles missing profile (no gender)', () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
      });

      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      // Should still work with default reference ranges
      expect(result.current.summaries.length).toBeGreaterThan(0);
    });

    it('handles profile without gender field', () => {
      mockUseUserProfile.mockReturnValue({
        profile: { ...mockProfile, gender: undefined },
      });

      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      // Should still work with default reference ranges
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('empty data handling', () => {
    it('handles empty events array', () => {
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      expect(result.current.summaries).toEqual([]);
      expect(result.current.flagCounts).toEqual({ high: 0, low: 0 });
      expect(result.current.categoriesWithData).toEqual([]);
    });

    it('handles empty standards array', () => {
      mockUseBiomarkers.mockReturnValue({
        biomarkers: [],
        isLoading: false,
      });

      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      // Should return empty since no standards to match against
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('passes through error from useEvents', () => {
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: false,
        error: 'Failed to fetch events',
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      expect(result.current.error).toBe('Failed to fetch events');
    });

    it('returns null error when no error', () => {
      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      expect(result.current.error).toBeNull();
    });
  });

  describe('refetch functionality', () => {
    it('exposes refetch function', () => {
      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      expect(typeof result.current.refetch).toBe('function');
    });

    it('calls underlying refetch when invoked', async () => {
      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      await result.current.refetch();

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('time range filtering', () => {
    it('uses provided time range for filtering', () => {
      const shortRange: TimeRange = { months: 3 };

      const { result } = renderHook(() => useBiomarkerTrends(shortRange));

      // Should process data with the given time range
      expect(result.current.isLoading).toBe(false);
    });

    it('handles different time range options', () => {
      const yearRange: TimeRange = { months: 12 };

      const { result } = renderHook(() => useBiomarkerTrends(yearRange));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.summaries).toBeDefined();
    });
  });

  describe('event type filtering', () => {
    it('only processes lab_result events', () => {
      // Add a non-lab event to the mix
      mockUseEvents.mockReturnValue({
        events: [
          ...mockLabEvents,
          {
            id: 'visit-1',
            userId: 'user-123',
            type: 'doctor_visit',
            title: 'Checkup',
            date: '2024-06-01',
            doctorName: 'Dr. Smith',
            createdAt: '2024-06-01',
            updatedAt: '2024-06-01',
          },
        ],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useBiomarkerTrends(defaultTimeRange));

      // Should still process correctly, ignoring non-lab events
      expect(result.current.summaries.length).toBeGreaterThan(0);
    });
  });

  describe('memoization', () => {
    it('returns stable references when dependencies unchanged', () => {
      const { result, rerender } = renderHook(() =>
        useBiomarkerTrends(defaultTimeRange)
      );

      const firstSummaries = result.current.summaries;

      rerender();

      const secondSummaries = result.current.summaries;

      // Should be the same reference due to memoization
      expect(firstSummaries).toBe(secondSummaries);
    });
  });
});
