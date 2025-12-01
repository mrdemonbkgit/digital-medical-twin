// Verification status: clean = no corrections needed, corrected = corrections applied successfully, failed = couldn't verify
export type VerificationStatus = 'clean' | 'corrected' | 'failed';

// Types matching the main extraction types
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

interface PageProcessingResult {
  pageNumber: number;
  biomarkers: Biomarker[];
  verificationStatus: VerificationStatus;
  corrections: string[];
}

export interface BiomarkerConflict {
  biomarkerName: string;
  sourcePages: number[];
  values: number[];
  keptValue: number;
}

export interface MergeResult {
  biomarkers: Biomarker[];
  duplicatesRemoved: number;
  sourcePages: Map<string, number[]>;
  warnings: string[];
  conflicts: BiomarkerConflict[];
}

/**
 * Normalize a biomarker name for comparison/deduplication
 * - Lowercase
 * - Remove special characters except alphanumeric
 * - Common abbreviations normalized
 */
function normalizeBiomarkerKey(name: string, unit: string): string {
  let normalizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    // Common variations
    .replace(/cholesterol/g, 'chol')
    .replace(/hemoglobin/g, 'hgb')
    .replace(/haemoglobin/g, 'hgb')
    .replace(/triglyceride/g, 'trig')
    .replace(/glucose/g, 'gluc')
    .replace(/creatinine/g, 'creat')
    .replace(/bilirubin/g, 'bili');

  const normalizedUnit = (unit || '')
    .toLowerCase()
    .replace(/[^a-z0-9/]/g, '');

  return `${normalizedName}:${normalizedUnit}`;
}

/**
 * Merge biomarkers from multiple page results, removing duplicates
 *
 * Strategy:
 * - First occurrence is kept
 * - Prefer entry with more complete data (reference range, flag)
 * - Log warning if same biomarker has different values across pages
 */
export function mergeBiomarkers(pageResults: PageProcessingResult[]): MergeResult {
  const biomarkerMap = new Map<
    string,
    {
      biomarker: Biomarker;
      pages: number[];
      allValues: number[]; // Track all values seen for conflict detection
    }
  >();
  const warnings: string[] = [];
  const conflicts: BiomarkerConflict[] = [];
  let totalFound = 0;

  for (const result of pageResults) {
    for (const biomarker of result.biomarkers) {
      totalFound++;
      const key = normalizeBiomarkerKey(biomarker.name, biomarker.unit);

      if (biomarkerMap.has(key)) {
        const existing = biomarkerMap.get(key)!;
        existing.pages.push(result.pageNumber);
        existing.allValues.push(biomarker.value);

        // Check for value discrepancies
        if (Math.abs(existing.biomarker.value - biomarker.value) > 0.01) {
          warnings.push(
            `Biomarker "${biomarker.name}" has different values on pages ${existing.pages.join(', ')}: ` +
              `${existing.biomarker.value} vs ${biomarker.value}`
          );
        }

        // Prefer entry with reference range if current doesn't have one
        if (!existing.biomarker.referenceMin && biomarker.referenceMin) {
          existing.biomarker = biomarker;
        }
        // Prefer entry with flag if current doesn't have one
        if (!existing.biomarker.flag && biomarker.flag) {
          existing.biomarker.flag = biomarker.flag;
        }
      } else {
        biomarkerMap.set(key, {
          biomarker: { ...biomarker }, // Clone to avoid mutation
          pages: [result.pageNumber],
          allValues: [biomarker.value],
        });
      }
    }
  }

  // Build conflicts array from entries with differing values
  for (const [, entry] of biomarkerMap) {
    const uniqueValues = [...new Set(entry.allValues)];
    if (uniqueValues.length > 1) {
      conflicts.push({
        biomarkerName: entry.biomarker.name,
        sourcePages: entry.pages,
        values: entry.allValues,
        keptValue: entry.biomarker.value,
      });
    }
  }

  // Convert map to arrays
  const merged = Array.from(biomarkerMap.values()).map((v) => v.biomarker);
  const sourcePages = new Map(
    Array.from(biomarkerMap.entries()).map(([k, v]) => [k, v.pages])
  );

  return {
    biomarkers: merged,
    duplicatesRemoved: totalFound - merged.length,
    sourcePages,
    warnings,
    conflicts,
  };
}

/**
 * Merge corrections from all pages
 */
export function mergeCorrections(pageResults: PageProcessingResult[]): string[] {
  const corrections: string[] = [];

  for (const result of pageResults) {
    if (result.corrections.length > 0) {
      corrections.push(
        ...result.corrections.map(
          (c) => `[Page ${result.pageNumber}] ${c}`
        )
      );
    }
  }

  return corrections;
}

/**
 * Calculate overall verification status from page results
 * - 'clean': All pages were clean (no corrections needed)
 * - 'corrected': At least one page had corrections applied successfully
 * - 'failed': At least one page failed verification
 */
export function calculateOverallVerificationStatus(
  pageResults: PageProcessingResult[]
): VerificationStatus {
  const hasFailed = pageResults.some((r) => r.verificationStatus === 'failed');
  if (hasFailed) return 'failed';

  const hasCorrected = pageResults.some((r) => r.verificationStatus === 'corrected');
  if (hasCorrected) return 'corrected';

  return 'clean';
}
