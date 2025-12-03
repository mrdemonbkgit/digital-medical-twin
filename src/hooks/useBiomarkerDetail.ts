import { useMemo } from 'react';
import { useEvents } from './useEvents';
import { useBiomarkers } from './useBiomarkers';
import { useUserProfile } from './useUserProfile';
import type { LabResult } from '@/types/events';
import type { BiomarkerStandard } from '@/types/biomarker';
import {
  extractBiomarkerTimeSeries,
  calculateStats,
  type TimeRange,
  type BiomarkerSummary,
  type TrendStats,
} from '@/lib/insights/dataProcessing';

interface UseBiomarkerDetailReturn {
  timeSeries: BiomarkerSummary | null;
  stats: TrendStats | null;
  standard: BiomarkerStandard | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBiomarkerDetail(
  biomarkerCode: string | null,
  timeRange: TimeRange
): UseBiomarkerDetailReturn {
  // Fetch all lab results
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
    if (!biomarkerCode || eventsLoading || standardsLoading) {
      return {
        timeSeries: null,
        stats: null,
        standard: null,
      };
    }

    const labResults = events.filter(
      (e): e is LabResult => e.type === 'lab_result'
    );

    const gender = profile?.gender as 'male' | 'female' | undefined;
    const timeSeries = extractBiomarkerTimeSeries(
      labResults,
      biomarkerCode,
      standards,
      gender,
      timeRange
    );

    const stats = timeSeries ? calculateStats(timeSeries.dataPoints) : null;

    // Find the matching standard
    const standard = standards.find(
      (s) =>
        s.code === biomarkerCode ||
        s.code === biomarkerCode.toLowerCase().replace(/[^a-z0-9]/g, '-')
    ) || null;

    return {
      timeSeries,
      stats,
      standard,
    };
  }, [biomarkerCode, events, standards, profile?.gender, timeRange, eventsLoading, standardsLoading]);

  return {
    ...processedData,
    isLoading: eventsLoading || standardsLoading,
    error: eventsError,
    refetch,
  };
}
