import { logger } from '@/lib/logger';

// Biomarker Standard Types

export type BiomarkerCategory =
  | 'metabolic'
  | 'lipid_panel'
  | 'cbc'
  | 'liver'
  | 'kidney'
  | 'thyroid'
  | 'vitamin'
  | 'hormone'
  | 'electrolyte'
  | 'inflammation'
  | 'cardiac'
  | 'iron'
  | 'autoimmune'
  | 'blood_gas'
  | 'coagulation'
  | 'hematology'
  | 'mineral'
  | 'nutrition'
  | 'pancreatic'
  | 'tumor_marker'
  | 'urinalysis'
  | 'other';

// Reference range for a specific gender
export interface ReferenceRange {
  low: number;
  high: number;
}

// Reference ranges by gender
export interface GenderReferenceRanges {
  male: ReferenceRange;
  female: ReferenceRange;
}

// Unit conversion map (from unit to standard unit)
// Value in standard unit = value * factor
export type UnitConversions = Record<string, number>;

// Database row type
export interface BiomarkerStandardRow {
  id: string;
  code: string;
  name: string;
  aliases: string[];
  category: string;
  standard_unit: string;
  unit_conversions: UnitConversions;
  reference_ranges: GenderReferenceRanges;
  description: string | null;
  clinical_significance: string | null;
  decimal_places: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Application type
export interface BiomarkerStandard {
  id: string;
  code: string;
  name: string;
  aliases: string[];
  category: BiomarkerCategory;
  standardUnit: string;
  unitConversions: UnitConversions;
  referenceRanges: GenderReferenceRanges;
  description?: string;
  clinicalSignificance?: string;
  decimalPlaces: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// For displaying in UI
export interface BiomarkerWithStatus extends BiomarkerStandard {
  // Latest value if available
  latestValue?: number;
  latestDate?: string;
  // Status based on reference range
  status?: 'normal' | 'low' | 'high' | 'critical';
}

// Category metadata for grouping
export const BIOMARKER_CATEGORIES: Record<BiomarkerCategory, { label: string; description: string }> = {
  metabolic: {
    label: 'Metabolic Panel',
    description: 'Blood sugar, electrolytes, and metabolic function',
  },
  lipid_panel: {
    label: 'Lipid Panel',
    description: 'Cholesterol and triglyceride levels',
  },
  cbc: {
    label: 'Complete Blood Count',
    description: 'Red blood cells, white blood cells, and platelets',
  },
  liver: {
    label: 'Liver Function',
    description: 'Enzymes and proteins indicating liver health',
  },
  kidney: {
    label: 'Kidney Function',
    description: 'Markers indicating kidney health and filtration',
  },
  thyroid: {
    label: 'Thyroid Panel',
    description: 'Hormones and markers for thyroid function',
  },
  vitamin: {
    label: 'Vitamins & Nutrients',
    description: 'Vitamin and mineral levels',
  },
  hormone: {
    label: 'Hormones',
    description: 'Hormone levels including sex hormones',
  },
  electrolyte: {
    label: 'Electrolytes',
    description: 'Essential minerals for body function',
  },
  inflammation: {
    label: 'Inflammation Markers',
    description: 'Indicators of inflammation in the body',
  },
  cardiac: {
    label: 'Cardiac Markers',
    description: 'Heart health indicators',
  },
  iron: {
    label: 'Iron Studies',
    description: 'Iron levels and storage',
  },
  autoimmune: {
    label: 'Autoimmune Markers',
    description: 'Antibodies and markers for autoimmune conditions',
  },
  blood_gas: {
    label: 'Blood Gas',
    description: 'Arterial blood gas and acid-base balance',
  },
  coagulation: {
    label: 'Coagulation',
    description: 'Blood clotting factors and times',
  },
  hematology: {
    label: 'Hematology',
    description: 'Blood cell morphology and related markers',
  },
  mineral: {
    label: 'Minerals',
    description: 'Essential mineral levels',
  },
  nutrition: {
    label: 'Nutrition',
    description: 'Nutritional status markers',
  },
  pancreatic: {
    label: 'Pancreatic',
    description: 'Pancreatic enzymes and function markers',
  },
  tumor_marker: {
    label: 'Tumor Markers',
    description: 'Cancer screening and monitoring markers',
  },
  urinalysis: {
    label: 'Urinalysis',
    description: 'Urine analysis markers',
  },
  other: {
    label: 'Other',
    description: 'Additional biomarkers',
  },
};

// Helper to convert database row to application type
export function rowToBiomarkerStandard(row: BiomarkerStandardRow): BiomarkerStandard {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    aliases: row.aliases || [],
    category: row.category as BiomarkerCategory,
    standardUnit: row.standard_unit,
    unitConversions: row.unit_conversions || {},
    referenceRanges: row.reference_ranges,
    description: row.description || undefined,
    clinicalSignificance: row.clinical_significance || undefined,
    decimalPlaces: row.decimal_places,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper to get status based on value and reference range
export function getBiomarkerStatus(
  value: number,
  referenceRange: ReferenceRange
): 'normal' | 'low' | 'high' | 'critical' {
  const { low, high } = referenceRange;
  const margin = (high - low) * 0.2; // 20% margin for critical

  if (value < low - margin) return 'critical';
  if (value < low) return 'low';
  if (value > high + margin) return 'critical';
  if (value > high) return 'high';
  return 'normal';
}

// Helper to convert value from one unit to standard unit
export function convertToStandardUnit(
  value: number,
  fromUnit: string,
  standardUnit: string,
  conversions: UnitConversions
): number {
  if (fromUnit.toLowerCase() === standardUnit.toLowerCase()) {
    return value;
  }

  const factor = conversions[fromUnit] || conversions[fromUnit.toLowerCase()];
  if (factor) {
    return value * factor;
  }

  // No conversion found, return original
  logger.warn('No biomarker conversion factor found', { fromUnit, standardUnit });
  return value;
}
