import type { Biomarker } from '@/types/events';

// Biomarker preset without value (user fills in)
export type BiomarkerPreset = Omit<Biomarker, 'value' | 'flag'>;

export interface BiomarkerPanel {
  name: string;
  description: string;
  biomarkers: BiomarkerPreset[];
}

export const BIOMARKER_PRESETS: Record<string, BiomarkerPanel> = {
  lipid: {
    name: 'Lipid Panel',
    description: 'Cholesterol and triglycerides',
    biomarkers: [
      { name: 'Total Cholesterol', unit: 'mg/dL', referenceMin: 0, referenceMax: 200 },
      { name: 'LDL Cholesterol', unit: 'mg/dL', referenceMin: 0, referenceMax: 100 },
      { name: 'HDL Cholesterol', unit: 'mg/dL', referenceMin: 40, referenceMax: 100 },
      { name: 'Triglycerides', unit: 'mg/dL', referenceMin: 0, referenceMax: 150 },
      { name: 'VLDL Cholesterol', unit: 'mg/dL', referenceMin: 5, referenceMax: 40 },
    ],
  },
  bmp: {
    name: 'Basic Metabolic Panel',
    description: 'Glucose, kidney function, electrolytes',
    biomarkers: [
      { name: 'Glucose', unit: 'mg/dL', referenceMin: 70, referenceMax: 100 },
      { name: 'BUN', unit: 'mg/dL', referenceMin: 7, referenceMax: 20 },
      { name: 'Creatinine', unit: 'mg/dL', referenceMin: 0.7, referenceMax: 1.3 },
      { name: 'Sodium', unit: 'mEq/L', referenceMin: 136, referenceMax: 145 },
      { name: 'Potassium', unit: 'mEq/L', referenceMin: 3.5, referenceMax: 5.0 },
      { name: 'Chloride', unit: 'mEq/L', referenceMin: 98, referenceMax: 106 },
      { name: 'CO2', unit: 'mEq/L', referenceMin: 23, referenceMax: 29 },
      { name: 'Calcium', unit: 'mg/dL', referenceMin: 8.5, referenceMax: 10.5 },
    ],
  },
  cmp: {
    name: 'Comprehensive Metabolic Panel',
    description: 'BMP plus liver function',
    biomarkers: [
      { name: 'Glucose', unit: 'mg/dL', referenceMin: 70, referenceMax: 100 },
      { name: 'BUN', unit: 'mg/dL', referenceMin: 7, referenceMax: 20 },
      { name: 'Creatinine', unit: 'mg/dL', referenceMin: 0.7, referenceMax: 1.3 },
      { name: 'Sodium', unit: 'mEq/L', referenceMin: 136, referenceMax: 145 },
      { name: 'Potassium', unit: 'mEq/L', referenceMin: 3.5, referenceMax: 5.0 },
      { name: 'Chloride', unit: 'mEq/L', referenceMin: 98, referenceMax: 106 },
      { name: 'CO2', unit: 'mEq/L', referenceMin: 23, referenceMax: 29 },
      { name: 'Calcium', unit: 'mg/dL', referenceMin: 8.5, referenceMax: 10.5 },
      { name: 'Total Protein', unit: 'g/dL', referenceMin: 6.0, referenceMax: 8.3 },
      { name: 'Albumin', unit: 'g/dL', referenceMin: 3.5, referenceMax: 5.0 },
      { name: 'Bilirubin', unit: 'mg/dL', referenceMin: 0.1, referenceMax: 1.2 },
      { name: 'ALP', unit: 'U/L', referenceMin: 44, referenceMax: 147 },
      { name: 'ALT', unit: 'U/L', referenceMin: 7, referenceMax: 56 },
      { name: 'AST', unit: 'U/L', referenceMin: 10, referenceMax: 40 },
    ],
  },
  cbc: {
    name: 'Complete Blood Count',
    description: 'Red cells, white cells, platelets',
    biomarkers: [
      { name: 'WBC', unit: 'K/uL', referenceMin: 4.5, referenceMax: 11.0 },
      { name: 'RBC', unit: 'M/uL', referenceMin: 4.5, referenceMax: 5.5 },
      { name: 'Hemoglobin', unit: 'g/dL', referenceMin: 13.5, referenceMax: 17.5 },
      { name: 'Hematocrit', unit: '%', referenceMin: 38, referenceMax: 50 },
      { name: 'MCV', unit: 'fL', referenceMin: 80, referenceMax: 100 },
      { name: 'MCH', unit: 'pg', referenceMin: 27, referenceMax: 33 },
      { name: 'MCHC', unit: 'g/dL', referenceMin: 32, referenceMax: 36 },
      { name: 'RDW', unit: '%', referenceMin: 11.5, referenceMax: 14.5 },
      { name: 'Platelets', unit: 'K/uL', referenceMin: 150, referenceMax: 400 },
    ],
  },
  thyroid: {
    name: 'Thyroid Panel',
    description: 'TSH and thyroid hormones',
    biomarkers: [
      { name: 'TSH', unit: 'mIU/L', referenceMin: 0.4, referenceMax: 4.0 },
      { name: 'Free T4', unit: 'ng/dL', referenceMin: 0.8, referenceMax: 1.8 },
      { name: 'Free T3', unit: 'pg/mL', referenceMin: 2.3, referenceMax: 4.2 },
      { name: 'Total T4', unit: 'ug/dL', referenceMin: 4.5, referenceMax: 12.0 },
      { name: 'Total T3', unit: 'ng/dL', referenceMin: 80, referenceMax: 200 },
    ],
  },
  hba1c: {
    name: 'HbA1c',
    description: 'Long-term blood sugar control',
    biomarkers: [
      { name: 'HbA1c', unit: '%', referenceMin: 0, referenceMax: 5.7 },
    ],
  },
  iron: {
    name: 'Iron Panel',
    description: 'Iron status and storage',
    biomarkers: [
      { name: 'Iron', unit: 'ug/dL', referenceMin: 60, referenceMax: 170 },
      { name: 'Ferritin', unit: 'ng/mL', referenceMin: 12, referenceMax: 300 },
      { name: 'TIBC', unit: 'ug/dL', referenceMin: 250, referenceMax: 400 },
      { name: 'Transferrin Saturation', unit: '%', referenceMin: 20, referenceMax: 50 },
    ],
  },
  vitaminD: {
    name: 'Vitamin D',
    description: '25-hydroxyvitamin D level',
    biomarkers: [
      { name: 'Vitamin D, 25-Hydroxy', unit: 'ng/mL', referenceMin: 30, referenceMax: 100 },
    ],
  },
  inflammation: {
    name: 'Inflammation Markers',
    description: 'CRP and ESR',
    biomarkers: [
      { name: 'CRP', unit: 'mg/L', referenceMin: 0, referenceMax: 3.0 },
      { name: 'hs-CRP', unit: 'mg/L', referenceMin: 0, referenceMax: 1.0 },
      { name: 'ESR', unit: 'mm/hr', referenceMin: 0, referenceMax: 20 },
    ],
  },
  liver: {
    name: 'Liver Function',
    description: 'Liver enzymes and function',
    biomarkers: [
      { name: 'ALT', unit: 'U/L', referenceMin: 7, referenceMax: 56 },
      { name: 'AST', unit: 'U/L', referenceMin: 10, referenceMax: 40 },
      { name: 'ALP', unit: 'U/L', referenceMin: 44, referenceMax: 147 },
      { name: 'GGT', unit: 'U/L', referenceMin: 9, referenceMax: 48 },
      { name: 'Bilirubin', unit: 'mg/dL', referenceMin: 0.1, referenceMax: 1.2 },
      { name: 'Albumin', unit: 'g/dL', referenceMin: 3.5, referenceMax: 5.0 },
    ],
  },
};

// Get preset keys for dropdown
export const PRESET_OPTIONS = Object.entries(BIOMARKER_PRESETS).map(([key, panel]) => ({
  value: key,
  label: panel.name,
  description: panel.description,
}));

// Convert preset biomarkers to full Biomarker objects (with empty values)
export function presetToBiomarkers(presetKey: string): Biomarker[] {
  const panel = BIOMARKER_PRESETS[presetKey];
  if (!panel) return [];

  return panel.biomarkers.map((preset) => ({
    ...preset,
    value: 0, // User will fill in
    flag: undefined,
  }));
}
