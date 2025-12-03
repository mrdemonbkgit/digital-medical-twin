import { describe, it, expect } from 'vitest';
import {
  mergeBiomarkers,
  mergeCorrections,
  calculateOverallVerificationStatus,
  type VerificationStatus,
} from './biomarkerMerger';

// Helper to create page results
interface Biomarker {
  name: string;
  value: number;
  unit: string;
  secondaryValue?: number;
  secondaryUnit?: string;
  referenceMin?: number;
  referenceMax?: number;
  flag?: 'high' | 'low' | 'normal';
}

interface PageResult {
  pageNumber: number;
  biomarkers: Biomarker[];
  verificationStatus: VerificationStatus;
  corrections: string[];
}

function createPageResult(
  pageNumber: number,
  biomarkers: Biomarker[],
  verificationStatus: VerificationStatus = 'clean',
  corrections: string[] = []
): PageResult {
  return { pageNumber, biomarkers, verificationStatus, corrections };
}

describe('mergeBiomarkers', () => {
  it('merges biomarkers from multiple pages', () => {
    const pages = [
      createPageResult(1, [
        { name: 'Glucose', value: 95, unit: 'mg/dL' },
      ]),
      createPageResult(2, [
        { name: 'Cholesterol', value: 180, unit: 'mg/dL' },
      ]),
    ];

    const result = mergeBiomarkers(pages);

    expect(result.biomarkers).toHaveLength(2);
    expect(result.biomarkers[0].name).toBe('Glucose');
    expect(result.biomarkers[1].name).toBe('Cholesterol');
    expect(result.duplicatesRemoved).toBe(0);
  });

  it('removes duplicates with same name and unit', () => {
    const pages = [
      createPageResult(1, [
        { name: 'Glucose', value: 95, unit: 'mg/dL' },
      ]),
      createPageResult(2, [
        { name: 'Glucose', value: 95, unit: 'mg/dL' },
      ]),
    ];

    const result = mergeBiomarkers(pages);

    expect(result.biomarkers).toHaveLength(1);
    expect(result.duplicatesRemoved).toBe(1);
  });

  it('normalizes name variations (hemoglobin vs haemoglobin)', () => {
    const pages = [
      createPageResult(1, [
        { name: 'Hemoglobin', value: 14.5, unit: 'g/dL' },
      ]),
      createPageResult(2, [
        { name: 'Haemoglobin', value: 14.5, unit: 'g/dL' },
      ]),
    ];

    const result = mergeBiomarkers(pages);

    expect(result.biomarkers).toHaveLength(1);
    expect(result.duplicatesRemoved).toBe(1);
  });

  it('normalizes cholesterol variations', () => {
    const pages = [
      createPageResult(1, [
        { name: 'Total Cholesterol', value: 180, unit: 'mg/dL' },
      ]),
      createPageResult(2, [
        { name: 'Total Chol', value: 180, unit: 'mg/dL' },
      ]),
    ];

    const result = mergeBiomarkers(pages);

    expect(result.biomarkers).toHaveLength(1);
    expect(result.duplicatesRemoved).toBe(1);
  });

  it('prefers entry with reference range over one without', () => {
    const pages = [
      createPageResult(1, [
        { name: 'Glucose', value: 95, unit: 'mg/dL' },
      ]),
      createPageResult(2, [
        { name: 'Glucose', value: 95, unit: 'mg/dL', referenceMin: 70, referenceMax: 100 },
      ]),
    ];

    const result = mergeBiomarkers(pages);

    expect(result.biomarkers).toHaveLength(1);
    expect(result.biomarkers[0].referenceMin).toBe(70);
    expect(result.biomarkers[0].referenceMax).toBe(100);
  });

  it('prefers entry with flag over one without', () => {
    const pages = [
      createPageResult(1, [
        { name: 'Glucose', value: 95, unit: 'mg/dL' },
      ]),
      createPageResult(2, [
        { name: 'Glucose', value: 95, unit: 'mg/dL', flag: 'normal' },
      ]),
    ];

    const result = mergeBiomarkers(pages);

    expect(result.biomarkers).toHaveLength(1);
    expect(result.biomarkers[0].flag).toBe('normal');
  });

  it('detects value conflicts and adds warning', () => {
    const pages = [
      createPageResult(1, [
        { name: 'Glucose', value: 95, unit: 'mg/dL' },
      ]),
      createPageResult(2, [
        { name: 'Glucose', value: 105, unit: 'mg/dL' },
      ]),
    ];

    const result = mergeBiomarkers(pages);

    expect(result.biomarkers).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('different values');
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].biomarkerName).toBe('Glucose');
    expect(result.conflicts[0].values).toContain(95);
    expect(result.conflicts[0].values).toContain(105);
  });

  it('tracks source pages for each biomarker', () => {
    const pages = [
      createPageResult(1, [
        { name: 'Glucose', value: 95, unit: 'mg/dL' },
      ]),
      createPageResult(2, [
        { name: 'Glucose', value: 95, unit: 'mg/dL' },
      ]),
      createPageResult(3, [
        { name: 'Cholesterol', value: 180, unit: 'mg/dL' },
      ]),
    ];

    const result = mergeBiomarkers(pages);

    // Check sourcePages map contains correct page numbers
    const glucoseKey = Array.from(result.sourcePages.keys()).find(k => k.includes('gluc'));
    const cholKey = Array.from(result.sourcePages.keys()).find(k => k.includes('chol'));

    expect(glucoseKey).toBeDefined();
    expect(cholKey).toBeDefined();
    expect(result.sourcePages.get(glucoseKey!)).toEqual([1, 2]);
    expect(result.sourcePages.get(cholKey!)).toEqual([3]);
  });

  it('handles empty page results', () => {
    const result = mergeBiomarkers([]);

    expect(result.biomarkers).toHaveLength(0);
    expect(result.duplicatesRemoved).toBe(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('handles single page', () => {
    const pages = [
      createPageResult(1, [
        { name: 'Glucose', value: 95, unit: 'mg/dL' },
        { name: 'Cholesterol', value: 180, unit: 'mg/dL' },
      ]),
    ];

    const result = mergeBiomarkers(pages);

    expect(result.biomarkers).toHaveLength(2);
    expect(result.duplicatesRemoved).toBe(0);
  });

  it('treats different units as different biomarkers', () => {
    const pages = [
      createPageResult(1, [
        { name: 'Glucose', value: 95, unit: 'mg/dL' },
        { name: 'Glucose', value: 5.3, unit: 'mmol/L' },
      ]),
    ];

    const result = mergeBiomarkers(pages);

    expect(result.biomarkers).toHaveLength(2);
  });
});

describe('mergeCorrections', () => {
  it('prefixes corrections with page number', () => {
    const pages = [
      createPageResult(1, [], 'corrected', ['Fixed glucose value']),
      createPageResult(2, [], 'corrected', ['Adjusted reference range']),
    ];

    const result = mergeCorrections(pages);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe('[Page 1] Fixed glucose value');
    expect(result[1]).toBe('[Page 2] Adjusted reference range');
  });

  it('handles pages with no corrections', () => {
    const pages = [
      createPageResult(1, [], 'clean', []),
      createPageResult(2, [], 'corrected', ['Fixed value']),
    ];

    const result = mergeCorrections(pages);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe('[Page 2] Fixed value');
  });

  it('handles empty input', () => {
    const result = mergeCorrections([]);

    expect(result).toHaveLength(0);
  });

  it('handles multiple corrections per page', () => {
    const pages = [
      createPageResult(1, [], 'corrected', ['Fix 1', 'Fix 2', 'Fix 3']),
    ];

    const result = mergeCorrections(pages);

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      '[Page 1] Fix 1',
      '[Page 1] Fix 2',
      '[Page 1] Fix 3',
    ]);
  });
});

describe('calculateOverallVerificationStatus', () => {
  it("returns 'failed' if any page failed", () => {
    const pages = [
      createPageResult(1, [], 'clean', []),
      createPageResult(2, [], 'failed', []),
      createPageResult(3, [], 'corrected', []),
    ];

    const result = calculateOverallVerificationStatus(pages);

    expect(result).toBe('failed');
  });

  it("returns 'corrected' if any page corrected (no failures)", () => {
    const pages = [
      createPageResult(1, [], 'clean', []),
      createPageResult(2, [], 'corrected', []),
      createPageResult(3, [], 'clean', []),
    ];

    const result = calculateOverallVerificationStatus(pages);

    expect(result).toBe('corrected');
  });

  it("returns 'clean' if all pages clean", () => {
    const pages = [
      createPageResult(1, [], 'clean', []),
      createPageResult(2, [], 'clean', []),
    ];

    const result = calculateOverallVerificationStatus(pages);

    expect(result).toBe('clean');
  });

  it("returns 'clean' for empty input", () => {
    const result = calculateOverallVerificationStatus([]);

    expect(result).toBe('clean');
  });

  it("returns 'failed' even with single failed page among many", () => {
    const pages = [
      createPageResult(1, [], 'clean', []),
      createPageResult(2, [], 'clean', []),
      createPageResult(3, [], 'clean', []),
      createPageResult(4, [], 'failed', []),
      createPageResult(5, [], 'clean', []),
    ];

    const result = calculateOverallVerificationStatus(pages);

    expect(result).toBe('failed');
  });
});
