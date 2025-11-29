import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getAllBiomarkers,
  getBiomarkersByCategory,
  searchBiomarkers,
} from '@/api/biomarkers';
import type { BiomarkerStandard, BiomarkerCategory } from '@/types';

interface UseBiomarkersOptions {
  category?: BiomarkerCategory;
  searchQuery?: string;
}

interface UseBiomarkersReturn {
  biomarkers: BiomarkerStandard[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Grouped by category for easy display
  groupedByCategory: Record<BiomarkerCategory, BiomarkerStandard[]>;
}

export function useBiomarkers(options: UseBiomarkersOptions = {}): UseBiomarkersReturn {
  const { category, searchQuery } = options;

  const [biomarkers, setBiomarkers] = useState<BiomarkerStandard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBiomarkers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data: BiomarkerStandard[];

      if (searchQuery) {
        data = await searchBiomarkers(searchQuery);
      } else if (category) {
        data = await getBiomarkersByCategory(category);
      } else {
        data = await getAllBiomarkers();
      }

      setBiomarkers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch biomarkers');
    } finally {
      setIsLoading(false);
    }
  }, [category, searchQuery]);

  useEffect(() => {
    fetchBiomarkers();
  }, [fetchBiomarkers]);

  // Group biomarkers by category
  const groupedByCategory = useMemo(() => {
    const grouped: Record<string, BiomarkerStandard[]> = {};

    for (const biomarker of biomarkers) {
      if (!grouped[biomarker.category]) {
        grouped[biomarker.category] = [];
      }
      grouped[biomarker.category].push(biomarker);
    }

    return grouped as Record<BiomarkerCategory, BiomarkerStandard[]>;
  }, [biomarkers]);

  return {
    biomarkers,
    isLoading,
    error,
    refetch: fetchBiomarkers,
    groupedByCategory,
  };
}
