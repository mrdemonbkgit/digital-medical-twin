import { describe, it, expect } from 'vitest';
import {
  BIOMARKER_PRESETS,
  PRESET_OPTIONS,
  presetToBiomarkers,
} from './biomarkerPresets';

describe('biomarkerPresets', () => {
  describe('BIOMARKER_PRESETS', () => {
    it('contains expected presets', () => {
      expect(BIOMARKER_PRESETS).toHaveProperty('lipid');
      expect(BIOMARKER_PRESETS).toHaveProperty('bmp');
      expect(BIOMARKER_PRESETS).toHaveProperty('cmp');
      expect(BIOMARKER_PRESETS).toHaveProperty('cbc');
      expect(BIOMARKER_PRESETS).toHaveProperty('thyroid');
      expect(BIOMARKER_PRESETS).toHaveProperty('hba1c');
      expect(BIOMARKER_PRESETS).toHaveProperty('iron');
      expect(BIOMARKER_PRESETS).toHaveProperty('vitaminD');
      expect(BIOMARKER_PRESETS).toHaveProperty('inflammation');
      expect(BIOMARKER_PRESETS).toHaveProperty('liver');
    });

    it('has valid structure for each preset', () => {
      Object.entries(BIOMARKER_PRESETS).forEach(([_key, panel]) => {
        expect(panel.name).toBeTruthy();
        expect(panel.description).toBeTruthy();
        expect(panel.biomarkers.length).toBeGreaterThan(0);

        panel.biomarkers.forEach((biomarker) => {
          expect(biomarker.name).toBeTruthy();
          expect(biomarker.unit).toBeTruthy();
          expect(typeof biomarker.referenceMin).toBe('number');
          expect(typeof biomarker.referenceMax).toBe('number');
          expect(biomarker.referenceMin).toBeLessThanOrEqual(biomarker.referenceMax!);
        });
      });
    });

    it('lipid panel has correct biomarkers', () => {
      const lipid = BIOMARKER_PRESETS.lipid;
      const names = lipid.biomarkers.map((b) => b.name);

      expect(names).toContain('Total Cholesterol');
      expect(names).toContain('LDL Cholesterol');
      expect(names).toContain('HDL Cholesterol');
      expect(names).toContain('Triglycerides');
    });

    it('CBC has correct biomarkers', () => {
      const cbc = BIOMARKER_PRESETS.cbc;
      const names = cbc.biomarkers.map((b) => b.name);

      expect(names).toContain('WBC');
      expect(names).toContain('RBC');
      expect(names).toContain('Hemoglobin');
      expect(names).toContain('Platelets');
    });
  });

  describe('PRESET_OPTIONS', () => {
    it('creates options from all presets', () => {
      expect(PRESET_OPTIONS.length).toBe(Object.keys(BIOMARKER_PRESETS).length);
    });

    it('each option has required properties', () => {
      PRESET_OPTIONS.forEach((option) => {
        expect(option.value).toBeTruthy();
        expect(option.label).toBeTruthy();
        expect(option.description).toBeTruthy();
      });
    });

    it('option values match preset keys', () => {
      const keys = Object.keys(BIOMARKER_PRESETS);
      const optionValues = PRESET_OPTIONS.map((o) => o.value);

      keys.forEach((key) => {
        expect(optionValues).toContain(key);
      });
    });
  });

  describe('presetToBiomarkers', () => {
    it('converts lipid preset to biomarkers', () => {
      const biomarkers = presetToBiomarkers('lipid');

      expect(biomarkers.length).toBe(BIOMARKER_PRESETS.lipid.biomarkers.length);
      biomarkers.forEach((b) => {
        expect(b.value).toBe(0);
        expect(b.flag).toBeUndefined();
        expect(b.name).toBeTruthy();
        expect(b.unit).toBeTruthy();
      });
    });

    it('returns empty array for invalid preset key', () => {
      const biomarkers = presetToBiomarkers('nonexistent');
      expect(biomarkers).toEqual([]);
    });

    it('preserves reference ranges', () => {
      const biomarkers = presetToBiomarkers('hba1c');

      expect(biomarkers.length).toBe(1);
      expect(biomarkers[0].name).toBe('HbA1c');
      expect(biomarkers[0].unit).toBe('%');
      expect(biomarkers[0].referenceMin).toBe(0);
      expect(biomarkers[0].referenceMax).toBe(5.7);
    });

    it('converts all preset types correctly', () => {
      Object.keys(BIOMARKER_PRESETS).forEach((key) => {
        const biomarkers = presetToBiomarkers(key);
        const expectedCount = BIOMARKER_PRESETS[key].biomarkers.length;

        expect(biomarkers.length).toBe(expectedCount);
        biomarkers.forEach((b) => {
          expect(b.value).toBe(0);
          expect(b.flag).toBeUndefined();
        });
      });
    });
  });
});
