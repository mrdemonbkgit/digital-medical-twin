import type { LabResult, Biomarker } from '@/types/events';
import type { BiomarkerStandard, BiomarkerCategory } from '@/types/biomarker';

// Time range options
export type TimeRange = '3m' | '6m' | '1y' | 'all';

// Single data point in a time series
export interface BiomarkerDataPoint {
  date: string;
  value: number;
  unit: string;
  flag?: 'high' | 'low' | 'normal';
  eventId: string;
}

// Summary of a biomarker with its trend data
export interface BiomarkerSummary {
  code: string; // standardCode or normalized name
  name: string;
  category: BiomarkerCategory;
  unit: string;
  latestValue: number;
  latestDate: string;
  flag?: 'high' | 'low' | 'normal';
  dataPoints: BiomarkerDataPoint[];
  referenceMin?: number;
  referenceMax?: number;
}

// Statistics for a biomarker trend
export interface TrendStats {
  current: number;
  average: number;
  min: number;
  max: number;
  trendDirection: 'up' | 'down' | 'stable';
  changePercent: number;
}

// Flag counts for the banner
export interface FlagCounts {
  high: number;
  low: number;
}

// Normalize a biomarker name to create a consistent key
function normalizeBiomarkerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Get a unique key for grouping biomarkers
function getBiomarkerKey(biomarker: Biomarker): string {
  if (biomarker.standardCode) {
    return biomarker.standardCode;
  }
  return normalizeBiomarkerName(biomarker.name);
}

// Get time range start date
function getTimeRangeStart(range: TimeRange): Date | null {
  if (range === 'all') return null;

  const now = new Date();
  switch (range) {
    case '3m':
      return new Date(now.setMonth(now.getMonth() - 3));
    case '6m':
      return new Date(now.setMonth(now.getMonth() - 6));
    case '1y':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return null;
  }
}

// Filter data points by time range
export function filterByTimeRange(
  dataPoints: BiomarkerDataPoint[],
  range: TimeRange
): BiomarkerDataPoint[] {
  const startDate = getTimeRangeStart(range);
  if (!startDate) return dataPoints;

  return dataPoints.filter((point) => new Date(point.date) >= startDate);
}

// Find matching biomarker standard
function findBiomarkerStandard(
  biomarker: Biomarker,
  standards: BiomarkerStandard[]
): BiomarkerStandard | undefined {
  // First try matching by standardCode
  if (biomarker.standardCode) {
    const match = standards.find((s) => s.code === biomarker.standardCode);
    if (match) return match;
  }

  // Fallback: match by normalized name
  const normalizedName = normalizeBiomarkerName(biomarker.name);
  return standards.find(
    (s) =>
      s.code === normalizedName ||
      normalizeBiomarkerName(s.name) === normalizedName ||
      s.aliases.some((a) => normalizeBiomarkerName(a) === normalizedName)
  );
}

// Get reference range for user's gender
function getReferenceRange(
  standard: BiomarkerStandard | undefined,
  gender: 'male' | 'female' | undefined
): { min?: number; max?: number } {
  if (!standard?.referenceRanges) {
    return {};
  }

  const genderKey = gender || 'male'; // Default to male if not specified
  const range = standard.referenceRanges[genderKey];

  if (range) {
    return { min: range.low, max: range.high };
  }

  return {};
}

// Extract all biomarker summaries from lab results
export function extractAllBiomarkerSummaries(
  labResults: LabResult[],
  standards: BiomarkerStandard[],
  gender: 'male' | 'female' | undefined,
  timeRange: TimeRange
): BiomarkerSummary[] {
  // Group all biomarker data points by key
  const biomarkerMap = new Map<
    string,
    {
      name: string;
      standard?: BiomarkerStandard;
      dataPoints: BiomarkerDataPoint[];
      referenceMin?: number;
      referenceMax?: number;
    }
  >();

  // Process all lab results
  for (const lab of labResults) {
    for (const biomarker of lab.biomarkers || []) {
      const key = getBiomarkerKey(biomarker);
      const standard = findBiomarkerStandard(biomarker, standards);
      const refRange = getReferenceRange(standard, gender);

      if (!biomarkerMap.has(key)) {
        biomarkerMap.set(key, {
          name: biomarker.name,
          standard,
          dataPoints: [],
          referenceMin: biomarker.referenceMin ?? refRange.min,
          referenceMax: biomarker.referenceMax ?? refRange.max,
        });
      }

      const entry = biomarkerMap.get(key)!;
      entry.dataPoints.push({
        date: lab.date,
        value: biomarker.value,
        unit: biomarker.unit,
        flag: biomarker.flag,
        eventId: lab.id,
      });
    }
  }

  // Convert map to array of summaries
  const summaries: BiomarkerSummary[] = [];

  for (const [code, data] of biomarkerMap) {
    // Sort data points by date (oldest first)
    const sortedPoints = [...data.dataPoints].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Filter by time range
    const filteredPoints = filterByTimeRange(sortedPoints, timeRange);

    // Skip if no data in range
    if (filteredPoints.length === 0) continue;

    // Get latest data point
    const latest = filteredPoints[filteredPoints.length - 1];

    summaries.push({
      code,
      name: data.name,
      category: data.standard?.category || 'other',
      unit: latest.unit,
      latestValue: latest.value,
      latestDate: latest.date,
      flag: latest.flag,
      dataPoints: filteredPoints,
      referenceMin: data.referenceMin,
      referenceMax: data.referenceMax,
    });
  }

  // Sort by category display order, then by name
  return summaries.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });
}

// Extract time series for a single biomarker
export function extractBiomarkerTimeSeries(
  labResults: LabResult[],
  biomarkerCode: string,
  standards: BiomarkerStandard[],
  gender: 'male' | 'female' | undefined,
  timeRange: TimeRange
): BiomarkerSummary | null {
  const allSummaries = extractAllBiomarkerSummaries(
    labResults,
    standards,
    gender,
    timeRange
  );

  return allSummaries.find((s) => s.code === biomarkerCode) || null;
}

// Calculate statistics from data points
export function calculateStats(dataPoints: BiomarkerDataPoint[]): TrendStats | null {
  if (dataPoints.length === 0) return null;

  const values = dataPoints.map((p) => p.value);
  const current = values[values.length - 1];
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Calculate trend direction
  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  let changePercent = 0;

  if (values.length >= 2) {
    const first = values[0];
    const last = values[values.length - 1];
    changePercent = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;

    // Consider stable if change is less than 5%
    if (Math.abs(changePercent) < 5) {
      trendDirection = 'stable';
    } else if (changePercent > 0) {
      trendDirection = 'up';
    } else {
      trendDirection = 'down';
    }
  }

  return {
    current,
    average: Math.round(average * 100) / 100,
    min,
    max,
    trendDirection,
    changePercent: Math.round(changePercent * 10) / 10,
  };
}

// Group summaries by category
export function groupByCategory(
  summaries: BiomarkerSummary[]
): Record<BiomarkerCategory, BiomarkerSummary[]> {
  const grouped: Record<BiomarkerCategory, BiomarkerSummary[]> = {} as Record<
    BiomarkerCategory,
    BiomarkerSummary[]
  >;

  for (const summary of summaries) {
    if (!grouped[summary.category]) {
      grouped[summary.category] = [];
    }
    grouped[summary.category].push(summary);
  }

  return grouped;
}

// Count flags (high/low) from summaries
export function countFlags(summaries: BiomarkerSummary[]): FlagCounts {
  let high = 0;
  let low = 0;

  for (const summary of summaries) {
    if (summary.flag === 'high') high++;
    else if (summary.flag === 'low') low++;
  }

  return { high, low };
}

// Get all categories that have data
export function getCategoriesWithData(
  summaries: BiomarkerSummary[]
): BiomarkerCategory[] {
  const categories = new Set<BiomarkerCategory>();

  for (const summary of summaries) {
    categories.add(summary.category);
  }

  return Array.from(categories).sort();
}
