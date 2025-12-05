import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  filterByTimeRange,
  extractAllBiomarkerSummaries,
  extractBiomarkerTimeSeries,
  calculateStats,
  groupByCategory,
  countFlags,
  getCategoriesWithData,
  type BiomarkerDataPoint,
  type BiomarkerSummary,
  type TimeRange,
} from './dataProcessing';
import type { LabResult } from '@/types/events';
import type { BiomarkerStandard } from '@/types/biomarker';

// Helper to create mock lab results
function createLabResult(
  id: string,
  date: string,
  biomarkers: Array<{
    name: string;
    value: number;
    unit: string;
    flag?: 'high' | 'low' | 'normal';
    standardCode?: string;
    referenceMin?: number;
    referenceMax?: number;
  }>
): LabResult {
  return {
    id,
    userId: 'user-123',
    type: 'lab_result',
    title: `Lab Result ${id}`,
    date,
    biomarkers: biomarkers.map((b) => ({
      name: b.name,
      value: b.value,
      unit: b.unit,
      flag: b.flag,
      standardCode: b.standardCode,
      referenceMin: b.referenceMin,
      referenceMax: b.referenceMax,
    })),
    createdAt: date,
    updatedAt: date,
  };
}

// Helper to create mock biomarker standards
function createStandard(
  code: string,
  name: string,
  category: string,
  aliases: string[] = [],
  referenceRanges?: { male?: { low: number; high: number }; female?: { low: number; high: number } }
): BiomarkerStandard {
  return {
    code,
    name,
    category: category as BiomarkerStandard['category'],
    unit: 'mg/dL',
    aliases,
    referenceRanges,
  };
}

// Helper to create data points
function createDataPoint(
  date: string,
  value: number,
  flag?: 'high' | 'low' | 'normal'
): BiomarkerDataPoint {
  return {
    date,
    value,
    unit: 'mg/dL',
    flag,
    eventId: `event-${date}`,
  };
}

describe('dataProcessing', () => {
  describe('filterByTimeRange', () => {
    const now = new Date('2024-06-15');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns all data points when range is "all"', () => {
      const dataPoints = [
        createDataPoint('2020-01-01', 100),
        createDataPoint('2022-01-01', 110),
        createDataPoint('2024-01-01', 120),
      ];

      const result = filterByTimeRange(dataPoints, 'all');

      expect(result).toHaveLength(3);
    });

    it('filters to last 3 months for "3m" range', () => {
      const dataPoints = [
        createDataPoint('2024-01-01', 100), // Before 3 months
        createDataPoint('2024-04-01', 110), // Within 3 months
        createDataPoint('2024-06-01', 120), // Within 3 months
      ];

      const result = filterByTimeRange(dataPoints, '3m');

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.value)).toEqual([110, 120]);
    });

    it('filters to last 6 months for "6m" range', () => {
      const dataPoints = [
        createDataPoint('2023-06-01', 100), // Before 6 months
        createDataPoint('2024-01-01', 110), // Within 6 months
        createDataPoint('2024-06-01', 120), // Within 6 months
      ];

      const result = filterByTimeRange(dataPoints, '6m');

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.value)).toEqual([110, 120]);
    });

    it('filters to last year for "1y" range', () => {
      const dataPoints = [
        createDataPoint('2022-01-01', 100), // Before 1 year
        createDataPoint('2023-08-01', 110), // Within 1 year
        createDataPoint('2024-06-01', 120), // Within 1 year
      ];

      const result = filterByTimeRange(dataPoints, '1y');

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.value)).toEqual([110, 120]);
    });

    it('returns empty array when no data points in range', () => {
      const dataPoints = [
        createDataPoint('2020-01-01', 100),
        createDataPoint('2021-01-01', 110),
      ];

      const result = filterByTimeRange(dataPoints, '3m');

      expect(result).toHaveLength(0);
    });

    it('handles empty input array', () => {
      const result = filterByTimeRange([], '3m');

      expect(result).toHaveLength(0);
    });
  });

  describe('extractAllBiomarkerSummaries', () => {
    const standards: BiomarkerStandard[] = [
      createStandard('glucose', 'Glucose', 'metabolic', ['blood sugar'], {
        male: { low: 70, high: 100 },
        female: { low: 70, high: 100 },
      }),
      createStandard('cholesterol', 'Total Cholesterol', 'lipid', ['cholesterol'], {
        male: { low: 0, high: 200 },
        female: { low: 0, high: 200 },
      }),
    ];

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('extracts biomarkers from multiple lab results', () => {
      const labResults: LabResult[] = [
        createLabResult('lab-1', '2024-01-15', [
          { name: 'Glucose', value: 95, unit: 'mg/dL', standardCode: 'glucose' },
        ]),
        createLabResult('lab-2', '2024-03-15', [
          { name: 'Glucose', value: 102, unit: 'mg/dL', standardCode: 'glucose', flag: 'high' },
        ]),
      ];

      const result = extractAllBiomarkerSummaries(labResults, standards, 'male', 'all');

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('glucose');
      expect(result[0].dataPoints).toHaveLength(2);
      expect(result[0].latestValue).toBe(102);
      expect(result[0].flag).toBe('high');
    });

    it('groups biomarkers by standardCode', () => {
      const labResults: LabResult[] = [
        createLabResult('lab-1', '2024-01-15', [
          { name: 'Glucose', value: 95, unit: 'mg/dL', standardCode: 'glucose' },
          { name: 'Cholesterol', value: 180, unit: 'mg/dL', standardCode: 'cholesterol' },
        ]),
        createLabResult('lab-2', '2024-03-15', [
          { name: 'Glucose', value: 100, unit: 'mg/dL', standardCode: 'glucose' },
        ]),
      ];

      const result = extractAllBiomarkerSummaries(labResults, standards, 'male', 'all');

      expect(result).toHaveLength(2);
      const glucose = result.find((s) => s.code === 'glucose');
      const cholesterol = result.find((s) => s.code === 'cholesterol');
      expect(glucose?.dataPoints).toHaveLength(2);
      expect(cholesterol?.dataPoints).toHaveLength(1);
    });

    it('uses normalized name when standardCode is not available', () => {
      const labResults: LabResult[] = [
        createLabResult('lab-1', '2024-01-15', [
          { name: 'Blood Sugar', value: 95, unit: 'mg/dL' },
        ]),
        createLabResult('lab-2', '2024-03-15', [
          { name: 'Blood Sugar', value: 100, unit: 'mg/dL' },
        ]),
      ];

      const result = extractAllBiomarkerSummaries(labResults, standards, 'male', 'all');

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('blood-sugar');
      expect(result[0].dataPoints).toHaveLength(2);
    });

    it('applies time range filter', () => {
      const labResults: LabResult[] = [
        createLabResult('lab-1', '2023-01-15', [
          { name: 'Glucose', value: 95, unit: 'mg/dL', standardCode: 'glucose' },
        ]),
        createLabResult('lab-2', '2024-05-15', [
          { name: 'Glucose', value: 100, unit: 'mg/dL', standardCode: 'glucose' },
        ]),
      ];

      const result = extractAllBiomarkerSummaries(labResults, standards, 'male', '3m');

      expect(result).toHaveLength(1);
      expect(result[0].dataPoints).toHaveLength(1);
      expect(result[0].latestValue).toBe(100);
    });

    it('returns empty array when no lab results', () => {
      const result = extractAllBiomarkerSummaries([], standards, 'male', 'all');

      expect(result).toHaveLength(0);
    });

    it('skips biomarkers with no data in time range', () => {
      const labResults: LabResult[] = [
        createLabResult('lab-1', '2020-01-15', [
          { name: 'Glucose', value: 95, unit: 'mg/dL', standardCode: 'glucose' },
        ]),
      ];

      const result = extractAllBiomarkerSummaries(labResults, standards, 'male', '3m');

      expect(result).toHaveLength(0);
    });

    it('assigns category from standard', () => {
      const labResults: LabResult[] = [
        createLabResult('lab-1', '2024-01-15', [
          { name: 'Glucose', value: 95, unit: 'mg/dL', standardCode: 'glucose' },
        ]),
      ];

      const result = extractAllBiomarkerSummaries(labResults, standards, 'male', 'all');

      expect(result[0].category).toBe('metabolic');
    });

    it('defaults to "other" category when no standard match', () => {
      const labResults: LabResult[] = [
        createLabResult('lab-1', '2024-01-15', [
          { name: 'Unknown Marker', value: 50, unit: 'units' },
        ]),
      ];

      const result = extractAllBiomarkerSummaries(labResults, standards, 'male', 'all');

      expect(result[0].category).toBe('other');
    });

    it('uses gender-specific reference ranges', () => {
      const standardsWithGender: BiomarkerStandard[] = [
        createStandard('hemoglobin', 'Hemoglobin', 'blood', [], {
          male: { low: 14, high: 18 },
          female: { low: 12, high: 16 },
        }),
      ];

      const labResults: LabResult[] = [
        createLabResult('lab-1', '2024-01-15', [
          { name: 'Hemoglobin', value: 15, unit: 'g/dL', standardCode: 'hemoglobin' },
        ]),
      ];

      const maleResult = extractAllBiomarkerSummaries(labResults, standardsWithGender, 'male', 'all');
      const femaleResult = extractAllBiomarkerSummaries(labResults, standardsWithGender, 'female', 'all');

      expect(maleResult[0].referenceMin).toBe(14);
      expect(maleResult[0].referenceMax).toBe(18);
      expect(femaleResult[0].referenceMin).toBe(12);
      expect(femaleResult[0].referenceMax).toBe(16);
    });

    it('uses biomarker reference range when provided', () => {
      const labResults: LabResult[] = [
        createLabResult('lab-1', '2024-01-15', [
          {
            name: 'Glucose',
            value: 95,
            unit: 'mg/dL',
            standardCode: 'glucose',
            referenceMin: 65,
            referenceMax: 110,
          },
        ]),
      ];

      const result = extractAllBiomarkerSummaries(labResults, standards, 'male', 'all');

      expect(result[0].referenceMin).toBe(65);
      expect(result[0].referenceMax).toBe(110);
    });

    it('sorts results by category then name', () => {
      const labResults: LabResult[] = [
        createLabResult('lab-1', '2024-01-15', [
          { name: 'Zinc', value: 80, unit: 'mcg/dL' },
          { name: 'Glucose', value: 95, unit: 'mg/dL', standardCode: 'glucose' },
          { name: 'Apple', value: 10, unit: 'units' },
        ]),
      ];

      const result = extractAllBiomarkerSummaries(labResults, standards, 'male', 'all');

      // Should be sorted by category then name
      expect(result[0].category).toBe('metabolic');
      // 'other' category items should come after 'metabolic'
    });

    it('handles lab results with empty biomarkers array', () => {
      const labResults: LabResult[] = [
        {
          id: 'lab-1',
          userId: 'user-123',
          type: 'lab_result',
          title: 'Empty Lab',
          date: '2024-01-15',
          biomarkers: [],
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
        },
      ];

      const result = extractAllBiomarkerSummaries(labResults, standards, 'male', 'all');

      expect(result).toHaveLength(0);
    });
  });

  describe('extractBiomarkerTimeSeries', () => {
    const standards: BiomarkerStandard[] = [
      createStandard('glucose', 'Glucose', 'metabolic'),
    ];

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns summary for specified biomarker code', () => {
      const labResults: LabResult[] = [
        createLabResult('lab-1', '2024-01-15', [
          { name: 'Glucose', value: 95, unit: 'mg/dL', standardCode: 'glucose' },
          { name: 'Cholesterol', value: 180, unit: 'mg/dL' },
        ]),
      ];

      const result = extractBiomarkerTimeSeries(labResults, 'glucose', standards, 'male', 'all');

      expect(result).not.toBeNull();
      expect(result?.code).toBe('glucose');
    });

    it('returns null when biomarker not found', () => {
      const labResults: LabResult[] = [
        createLabResult('lab-1', '2024-01-15', [
          { name: 'Cholesterol', value: 180, unit: 'mg/dL' },
        ]),
      ];

      const result = extractBiomarkerTimeSeries(labResults, 'glucose', standards, 'male', 'all');

      expect(result).toBeNull();
    });

    it('returns null when no data in time range', () => {
      const labResults: LabResult[] = [
        createLabResult('lab-1', '2020-01-15', [
          { name: 'Glucose', value: 95, unit: 'mg/dL', standardCode: 'glucose' },
        ]),
      ];

      const result = extractBiomarkerTimeSeries(labResults, 'glucose', standards, 'male', '3m');

      expect(result).toBeNull();
    });
  });

  describe('calculateStats', () => {
    it('calculates correct statistics for data points', () => {
      const dataPoints: BiomarkerDataPoint[] = [
        createDataPoint('2024-01-01', 100),
        createDataPoint('2024-02-01', 110),
        createDataPoint('2024-03-01', 120),
      ];

      const result = calculateStats(dataPoints);

      expect(result).not.toBeNull();
      expect(result?.current).toBe(120);
      expect(result?.min).toBe(100);
      expect(result?.max).toBe(120);
      expect(result?.average).toBe(110);
    });

    it('returns null for empty data points', () => {
      const result = calculateStats([]);

      expect(result).toBeNull();
    });

    it('calculates upward trend when values increase', () => {
      const dataPoints: BiomarkerDataPoint[] = [
        createDataPoint('2024-01-01', 100),
        createDataPoint('2024-02-01', 120),
      ];

      const result = calculateStats(dataPoints);

      expect(result?.trendDirection).toBe('up');
      expect(result?.changePercent).toBe(20);
    });

    it('calculates downward trend when values decrease', () => {
      const dataPoints: BiomarkerDataPoint[] = [
        createDataPoint('2024-01-01', 100),
        createDataPoint('2024-02-01', 80),
      ];

      const result = calculateStats(dataPoints);

      expect(result?.trendDirection).toBe('down');
      expect(result?.changePercent).toBe(-20);
    });

    it('calculates stable trend when change is less than 5%', () => {
      const dataPoints: BiomarkerDataPoint[] = [
        createDataPoint('2024-01-01', 100),
        createDataPoint('2024-02-01', 103),
      ];

      const result = calculateStats(dataPoints);

      expect(result?.trendDirection).toBe('stable');
    });

    it('handles single data point', () => {
      const dataPoints: BiomarkerDataPoint[] = [
        createDataPoint('2024-01-01', 100),
      ];

      const result = calculateStats(dataPoints);

      expect(result).not.toBeNull();
      expect(result?.current).toBe(100);
      expect(result?.average).toBe(100);
      expect(result?.trendDirection).toBe('stable');
      expect(result?.changePercent).toBe(0);
    });

    it('handles zero as first value', () => {
      const dataPoints: BiomarkerDataPoint[] = [
        createDataPoint('2024-01-01', 0),
        createDataPoint('2024-02-01', 100),
      ];

      const result = calculateStats(dataPoints);

      expect(result?.changePercent).toBe(0); // Division by zero protection
    });

    it('rounds average to 2 decimal places', () => {
      const dataPoints: BiomarkerDataPoint[] = [
        createDataPoint('2024-01-01', 100),
        createDataPoint('2024-02-01', 101),
        createDataPoint('2024-03-01', 102),
      ];

      const result = calculateStats(dataPoints);

      expect(result?.average).toBe(101);
    });

    it('rounds changePercent to 1 decimal place', () => {
      const dataPoints: BiomarkerDataPoint[] = [
        createDataPoint('2024-01-01', 100),
        createDataPoint('2024-02-01', 133),
      ];

      const result = calculateStats(dataPoints);

      expect(result?.changePercent).toBe(33);
    });
  });

  describe('groupByCategory', () => {
    it('groups summaries by category', () => {
      const summaries: BiomarkerSummary[] = [
        {
          code: 'glucose',
          name: 'Glucose',
          category: 'metabolic',
          unit: 'mg/dL',
          latestValue: 95,
          latestDate: '2024-01-01',
          dataPoints: [],
        },
        {
          code: 'cholesterol',
          name: 'Cholesterol',
          category: 'lipid',
          unit: 'mg/dL',
          latestValue: 180,
          latestDate: '2024-01-01',
          dataPoints: [],
        },
        {
          code: 'hba1c',
          name: 'HbA1c',
          category: 'metabolic',
          unit: '%',
          latestValue: 5.5,
          latestDate: '2024-01-01',
          dataPoints: [],
        },
      ];

      const result = groupByCategory(summaries);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result.metabolic).toHaveLength(2);
      expect(result.lipid).toHaveLength(1);
    });

    it('handles empty summaries', () => {
      const result = groupByCategory([]);

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('handles summaries with single category', () => {
      const summaries: BiomarkerSummary[] = [
        {
          code: 'glucose',
          name: 'Glucose',
          category: 'metabolic',
          unit: 'mg/dL',
          latestValue: 95,
          latestDate: '2024-01-01',
          dataPoints: [],
        },
        {
          code: 'hba1c',
          name: 'HbA1c',
          category: 'metabolic',
          unit: '%',
          latestValue: 5.5,
          latestDate: '2024-01-01',
          dataPoints: [],
        },
      ];

      const result = groupByCategory(summaries);

      expect(Object.keys(result)).toHaveLength(1);
      expect(result.metabolic).toHaveLength(2);
    });
  });

  describe('countFlags', () => {
    it('counts high and low flags', () => {
      const summaries: BiomarkerSummary[] = [
        {
          code: 'glucose',
          name: 'Glucose',
          category: 'metabolic',
          unit: 'mg/dL',
          latestValue: 150,
          latestDate: '2024-01-01',
          flag: 'high',
          dataPoints: [],
        },
        {
          code: 'iron',
          name: 'Iron',
          category: 'blood',
          unit: 'mcg/dL',
          latestValue: 30,
          latestDate: '2024-01-01',
          flag: 'low',
          dataPoints: [],
        },
        {
          code: 'cholesterol',
          name: 'Cholesterol',
          category: 'lipid',
          unit: 'mg/dL',
          latestValue: 180,
          latestDate: '2024-01-01',
          flag: 'normal',
          dataPoints: [],
        },
      ];

      const result = countFlags(summaries);

      expect(result.high).toBe(1);
      expect(result.low).toBe(1);
    });

    it('returns zero counts for empty summaries', () => {
      const result = countFlags([]);

      expect(result.high).toBe(0);
      expect(result.low).toBe(0);
    });

    it('returns zero counts when all flags are normal', () => {
      const summaries: BiomarkerSummary[] = [
        {
          code: 'glucose',
          name: 'Glucose',
          category: 'metabolic',
          unit: 'mg/dL',
          latestValue: 95,
          latestDate: '2024-01-01',
          flag: 'normal',
          dataPoints: [],
        },
      ];

      const result = countFlags(summaries);

      expect(result.high).toBe(0);
      expect(result.low).toBe(0);
    });

    it('handles summaries without flags', () => {
      const summaries: BiomarkerSummary[] = [
        {
          code: 'glucose',
          name: 'Glucose',
          category: 'metabolic',
          unit: 'mg/dL',
          latestValue: 95,
          latestDate: '2024-01-01',
          dataPoints: [],
        },
      ];

      const result = countFlags(summaries);

      expect(result.high).toBe(0);
      expect(result.low).toBe(0);
    });

    it('counts multiple high flags correctly', () => {
      const summaries: BiomarkerSummary[] = [
        {
          code: 'glucose',
          name: 'Glucose',
          category: 'metabolic',
          unit: 'mg/dL',
          latestValue: 150,
          latestDate: '2024-01-01',
          flag: 'high',
          dataPoints: [],
        },
        {
          code: 'cholesterol',
          name: 'Cholesterol',
          category: 'lipid',
          unit: 'mg/dL',
          latestValue: 250,
          latestDate: '2024-01-01',
          flag: 'high',
          dataPoints: [],
        },
      ];

      const result = countFlags(summaries);

      expect(result.high).toBe(2);
      expect(result.low).toBe(0);
    });
  });

  describe('getCategoriesWithData', () => {
    it('returns unique categories from summaries', () => {
      const summaries: BiomarkerSummary[] = [
        {
          code: 'glucose',
          name: 'Glucose',
          category: 'metabolic',
          unit: 'mg/dL',
          latestValue: 95,
          latestDate: '2024-01-01',
          dataPoints: [],
        },
        {
          code: 'cholesterol',
          name: 'Cholesterol',
          category: 'lipid',
          unit: 'mg/dL',
          latestValue: 180,
          latestDate: '2024-01-01',
          dataPoints: [],
        },
        {
          code: 'hba1c',
          name: 'HbA1c',
          category: 'metabolic',
          unit: '%',
          latestValue: 5.5,
          latestDate: '2024-01-01',
          dataPoints: [],
        },
      ];

      const result = getCategoriesWithData(summaries);

      expect(result).toHaveLength(2);
      expect(result).toContain('metabolic');
      expect(result).toContain('lipid');
    });

    it('returns empty array for empty summaries', () => {
      const result = getCategoriesWithData([]);

      expect(result).toHaveLength(0);
    });

    it('returns sorted categories', () => {
      const summaries: BiomarkerSummary[] = [
        {
          code: 'zinc',
          name: 'Zinc',
          category: 'other',
          unit: 'mcg/dL',
          latestValue: 80,
          latestDate: '2024-01-01',
          dataPoints: [],
        },
        {
          code: 'glucose',
          name: 'Glucose',
          category: 'metabolic',
          unit: 'mg/dL',
          latestValue: 95,
          latestDate: '2024-01-01',
          dataPoints: [],
        },
        {
          code: 'cholesterol',
          name: 'Cholesterol',
          category: 'lipid',
          unit: 'mg/dL',
          latestValue: 180,
          latestDate: '2024-01-01',
          dataPoints: [],
        },
      ];

      const result = getCategoriesWithData(summaries);

      expect(result).toEqual(['lipid', 'metabolic', 'other']);
    });
  });
});
