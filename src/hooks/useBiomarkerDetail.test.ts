import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBiomarkerDetail } from './useBiomarkerDetail';
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
    { name: 'Glucose', value: 110, unit: 'mg/dL' },
    { name: 'HDL Cholesterol', value: 48, unit: 'mg/dL' },
  ]),
  createLabResult('lab-3', '2024-01-01', [
    { name: 'Glucose', value: 88, unit: 'mg/dL' },
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

describe('useBiomarkerDetail', () => {
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

  describe('null biomarkerCode', () => {
    it('returns null values when biomarkerCode is null', () => {
      const { result } = renderHook(() =>
        useBiomarkerDetail(null, defaultTimeRange)
      );

      expect(result.current.timeSeries).toBeNull();
      expect(result.current.stats).toBeNull();
      expect(result.current.standard).toBeNull();
    });

    it('does not process data when biomarkerCode is null', () => {
      const { result } = renderHook(() =>
        useBiomarkerDetail(null, defaultTimeRange)
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('loading states', () => {
    it('returns null while loading events', () => {
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.timeSeries).toBeNull();
      expect(result.current.stats).toBeNull();
    });

    it('returns null while loading standards', () => {
      mockUseBiomarkers.mockReturnValue({
        biomarkers: [],
        isLoading: true,
      });

      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.timeSeries).toBeNull();
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

      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('time series extraction', () => {
    it('extracts time series for specific biomarker', () => {
      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      expect(result.current.timeSeries).not.toBeNull();
      expect(result.current.timeSeries?.code).toBe('glucose');
    });

    it('returns null time series when biomarker not found', () => {
      const { result } = renderHook(() =>
        useBiomarkerDetail('nonexistent', defaultTimeRange)
      );

      expect(result.current.timeSeries).toBeNull();
    });
  });

  describe('stats calculation', () => {
    it('calculates stats from time series', () => {
      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      expect(result.current.stats).not.toBeNull();
      // Stats should have properties like current, average, min, max
      if (result.current.stats) {
        expect(typeof result.current.stats.current).toBe('number');
        expect(typeof result.current.stats.average).toBe('number');
      }
    });

    it('returns null stats when no time series', () => {
      const { result } = renderHook(() =>
        useBiomarkerDetail('nonexistent', defaultTimeRange)
      );

      expect(result.current.stats).toBeNull();
    });
  });

  describe('standard finding', () => {
    it('finds matching standard by code', () => {
      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      expect(result.current.standard).not.toBeNull();
      expect(result.current.standard?.code).toBe('glucose');
      expect(result.current.standard?.name).toBe('Glucose');
    });

    it('finds standard with normalized code', () => {
      const { result } = renderHook(() =>
        useBiomarkerDetail('hdl_cholesterol', defaultTimeRange)
      );

      expect(result.current.standard).not.toBeNull();
      expect(result.current.standard?.code).toBe('hdl_cholesterol');
    });

    it('returns null standard when not found', () => {
      const { result } = renderHook(() =>
        useBiomarkerDetail('nonexistent', defaultTimeRange)
      );

      expect(result.current.standard).toBeNull();
    });
  });

  describe('profile handling', () => {
    it('uses male gender for reference ranges', () => {
      mockUseUserProfile.mockReturnValue({
        profile: { ...mockProfile, gender: 'male' },
      });

      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      expect(result.current.timeSeries).not.toBeNull();
    });

    it('uses female gender for reference ranges', () => {
      mockUseUserProfile.mockReturnValue({
        profile: { ...mockProfile, gender: 'female' },
      });

      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      expect(result.current.timeSeries).not.toBeNull();
    });

    it('handles missing profile', () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
      });

      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      // Should still work with default reference ranges
      expect(result.current.isLoading).toBe(false);
    });

    it('handles profile without gender', () => {
      mockUseUserProfile.mockReturnValue({
        profile: { ...mockProfile, gender: undefined },
      });

      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

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

      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      expect(result.current.error).toBe('Failed to fetch events');
    });

    it('returns null error when no error', () => {
      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      expect(result.current.error).toBeNull();
    });
  });

  describe('refetch functionality', () => {
    it('exposes refetch function', () => {
      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      expect(typeof result.current.refetch).toBe('function');
    });

    it('calls underlying refetch when invoked', async () => {
      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      await result.current.refetch();

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('time range filtering', () => {
    it('uses provided time range', () => {
      const shortRange: TimeRange = { months: 3 };

      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', shortRange)
      );

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

      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      expect(result.current.timeSeries).toBeNull();
      expect(result.current.stats).toBeNull();
    });

    it('handles empty standards array', () => {
      mockUseBiomarkers.mockReturnValue({
        biomarkers: [],
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      expect(result.current.standard).toBeNull();
    });
  });

  describe('memoization', () => {
    it('returns stable references when dependencies unchanged', () => {
      const { result, rerender } = renderHook(() =>
        useBiomarkerDetail('glucose', defaultTimeRange)
      );

      const firstTimeSeries = result.current.timeSeries;

      rerender();

      const secondTimeSeries = result.current.timeSeries;

      expect(firstTimeSeries).toBe(secondTimeSeries);
    });

    it('recomputes when biomarkerCode changes', () => {
      const { result, rerender } = renderHook(
        ({ code }) => useBiomarkerDetail(code, defaultTimeRange),
        { initialProps: { code: 'glucose' } }
      );

      const firstStandard = result.current.standard;
      expect(firstStandard?.code).toBe('glucose');

      rerender({ code: 'hdl_cholesterol' });

      const secondStandard = result.current.standard;
      expect(secondStandard?.code).toBe('hdl_cholesterol');
    });
  });
});
