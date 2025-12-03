import { useMemo } from 'react';
import { useEvents } from './useEvents';
import { useBiomarkers } from './useBiomarkers';
import { useUserProfile } from './useUserProfile';
import type { LabResult } from '@/types/events';
import type { BiomarkerCategory } from '@/types/biomarker';
import {
  extractAllBiomarkerSummaries,
  groupByCategory,
  countFlags,
  getCategoriesWithData,
  type TimeRange,
  type BiomarkerSummary,
  type FlagCounts,
} from '@/lib/insights/dataProcessing';

interface UseBiomarkerTrendsReturn {
  summaries: BiomarkerSummary[];
  groupedByCategory: Record<BiomarkerCategory, BiomarkerSummary[]>;
  flagCounts: FlagCounts;
  categoriesWithData: BiomarkerCategory[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBiomarkerTrends(timeRange: TimeRange): UseBiomarkerTrendsReturn {
  // Fetch all lab results with high limit
  const {
    events,
    isLoading: eventsLoading,
    error: eventsError,
    refetch,
  } = useEvents({
    filters: { eventTypes: ['lab_result'] },
    pagination: { limit: 1000 },
  });

  // Fetch biomarker standards
  const { biomarkers: standards, isLoading: standardsLoading } = useBiomarkers();

  // Get user profile for gender
  const { profile } = useUserProfile();

  // Process the data
  const processedData = useMemo(() => {
    if (eventsLoading || standardsLoading) {
      return {
        summaries: [],
        groupedByCategory: {} as Record<BiomarkerCategory, BiomarkerSummary[]>,
        flagCounts: { high: 0, low: 0 },
        categoriesWithData: [],
      };
    }

    const labResults = events.filter(
      (e): e is LabResult => e.type === 'lab_result'
    );

    const gender = profile?.gender as 'male' | 'female' | undefined;
    const summaries = extractAllBiomarkerSummaries(
      labResults,
      standards,
      gender,
      timeRange
    );

    return {
      summaries,
      groupedByCategory: groupByCategory(summaries),
      flagCounts: countFlags(summaries),
      categoriesWithData: getCategoriesWithData(summaries),
    };
  }, [events, standards, profile?.gender, timeRange, eventsLoading, standardsLoading]);

  return {
    ...processedData,
    isLoading: eventsLoading || standardsLoading,
    error: eventsError,
    refetch,
  };
}
