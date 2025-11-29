import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBiomarkers } from './useBiomarkers';
import type { BiomarkerStandard } from '@/types';

// Mock the API module
vi.mock('@/api/biomarkers', () => ({
  getAllBiomarkers: vi.fn(),
  getBiomarkersByCategory: vi.fn(),
  searchBiomarkers: vi.fn(),
}));

import { getAllBiomarkers, getBiomarkersByCategory, searchBiomarkers } from '@/api/biomarkers';

const mockBiomarkers: BiomarkerStandard[] = [
  {
    id: '1',
    code: 'LDL',
    name: 'LDL Cholesterol',
    aliases: ['Low Density Lipoprotein'],
    category: 'lipid_panel',
    standardUnit: 'mg/dL',
    unitConversions: { 'mmol/L': 38.67 },
    referenceRanges: {
      male: { min: 0, max: 100 },
      female: { min: 0, max: 100 },
    },
    description: 'Bad cholesterol',
    interpretationGuide: null,
    displayOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'HDL',
    name: 'HDL Cholesterol',
    aliases: ['High Density Lipoprotein'],
    category: 'lipid_panel',
    standardUnit: 'mg/dL',
    unitConversions: { 'mmol/L': 38.67 },
    referenceRanges: {
      male: { min: 40, max: 60 },
      female: { min: 50, max: 70 },
    },
    description: 'Good cholesterol',
    interpretationGuide: null,
    displayOrder: 2,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    code: 'GLUCOSE_FASTING',
    name: 'Glucose, Fasting',
    aliases: ['Fasting Blood Sugar'],
    category: 'metabolic',
    standardUnit: 'mg/dL',
    unitConversions: { 'mmol/L': 18.0 },
    referenceRanges: {
      male: { min: 70, max: 100 },
      female: { min: 70, max: 100 },
    },
    description: 'Blood sugar after fasting',
    interpretationGuide: null,
    displayOrder: 3,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

describe('useBiomarkers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns loading state initially', () => {
    vi.mocked(getAllBiomarkers).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useBiomarkers());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.biomarkers).toEqual([]);
  });

  it('fetches all biomarkers on mount by default', async () => {
    vi.mocked(getAllBiomarkers).mockResolvedValue(mockBiomarkers);

    const { result } = renderHook(() => useBiomarkers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.biomarkers).toEqual(mockBiomarkers);
    expect(getAllBiomarkers).toHaveBeenCalledTimes(1);
  });

  it('fetches biomarkers by category when category option provided', async () => {
    const lipidBiomarkers = mockBiomarkers.filter((b) => b.category === 'lipid_panel');
    vi.mocked(getBiomarkersByCategory).mockResolvedValue(lipidBiomarkers);

    const { result } = renderHook(() => useBiomarkers({ category: 'lipid_panel' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.biomarkers).toEqual(lipidBiomarkers);
    expect(getBiomarkersByCategory).toHaveBeenCalledWith('lipid_panel');
    expect(getAllBiomarkers).not.toHaveBeenCalled();
  });

  it('searches biomarkers when searchQuery option provided (>= 2 chars)', async () => {
    const searchResults = [mockBiomarkers[0]];
    vi.mocked(searchBiomarkers).mockResolvedValue(searchResults);

    const { result } = renderHook(() => useBiomarkers({ searchQuery: 'ldl' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.biomarkers).toEqual(searchResults);
    expect(searchBiomarkers).toHaveBeenCalledWith('ldl');
    expect(getAllBiomarkers).not.toHaveBeenCalled();
  });

  it('searches biomarkers even with single character query', async () => {
    const searchResults = [mockBiomarkers[0]];
    vi.mocked(searchBiomarkers).mockResolvedValue(searchResults);

    const { result } = renderHook(() => useBiomarkers({ searchQuery: 'l' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(searchBiomarkers).toHaveBeenCalledWith('l');
    expect(getAllBiomarkers).not.toHaveBeenCalled();
    expect(result.current.biomarkers).toEqual(searchResults);
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(getAllBiomarkers).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useBiomarkers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.biomarkers).toEqual([]);
  });

  it('handles non-Error exceptions', async () => {
    vi.mocked(getAllBiomarkers).mockRejectedValue('Unknown error');

    const { result } = renderHook(() => useBiomarkers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch biomarkers');
  });

  it('refetch reloads biomarkers', async () => {
    vi.mocked(getAllBiomarkers).mockResolvedValue([mockBiomarkers[0]]);

    const { result } = renderHook(() => useBiomarkers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.biomarkers).toHaveLength(1);

    // Update mock for refetch
    vi.mocked(getAllBiomarkers).mockResolvedValue(mockBiomarkers);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.biomarkers).toHaveLength(3);
    expect(getAllBiomarkers).toHaveBeenCalledTimes(2);
  });

  describe('groupedByCategory', () => {
    it('groups biomarkers by category', async () => {
      vi.mocked(getAllBiomarkers).mockResolvedValue(mockBiomarkers);

      const { result } = renderHook(() => useBiomarkers());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const grouped = result.current.groupedByCategory;

      expect(grouped.lipid_panel).toHaveLength(2);
      expect(grouped.metabolic).toHaveLength(1);
    });

    it('returns empty object when no biomarkers', async () => {
      vi.mocked(getAllBiomarkers).mockResolvedValue([]);

      const { result } = renderHook(() => useBiomarkers());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.groupedByCategory).toEqual({});
    });

    it('updates groupedByCategory when biomarkers change', async () => {
      vi.mocked(getAllBiomarkers).mockResolvedValue([mockBiomarkers[0]]);

      const { result } = renderHook(() => useBiomarkers());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.groupedByCategory.lipid_panel).toHaveLength(1);

      // Update mock for refetch
      vi.mocked(getAllBiomarkers).mockResolvedValue(mockBiomarkers);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.groupedByCategory.lipid_panel).toHaveLength(2);
      expect(result.current.groupedByCategory.metabolic).toHaveLength(1);
    });
  });

  describe('reactivity to options changes', () => {
    it('refetches when category changes', async () => {
      vi.mocked(getAllBiomarkers).mockResolvedValue(mockBiomarkers);
      vi.mocked(getBiomarkersByCategory).mockResolvedValue([mockBiomarkers[2]]);

      const { result, rerender } = renderHook(
        (props: { category?: 'lipid_panel' | 'metabolic' }) => useBiomarkers(props),
        { initialProps: {} }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(getAllBiomarkers).toHaveBeenCalledTimes(1);

      // Change category
      rerender({ category: 'metabolic' });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(getBiomarkersByCategory).toHaveBeenCalledWith('metabolic');
    });

    it('refetches when searchQuery changes', async () => {
      vi.mocked(getAllBiomarkers).mockResolvedValue(mockBiomarkers);
      vi.mocked(searchBiomarkers).mockResolvedValue([mockBiomarkers[0]]);

      const { result, rerender } = renderHook(
        (props: { searchQuery?: string }) => useBiomarkers(props),
        { initialProps: {} }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(getAllBiomarkers).toHaveBeenCalledTimes(1);

      // Change search query
      rerender({ searchQuery: 'ldl' });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(searchBiomarkers).toHaveBeenCalledWith('ldl');
    });
  });
});
