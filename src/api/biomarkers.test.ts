import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllBiomarkers,
  getBiomarkersByCategory,
  getBiomarkerByCode,
  searchBiomarkers,
  getBiomarkerCategories,
  matchBiomarker,
} from './biomarkers';
import type { BiomarkerStandardRow } from '@/types';

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

const mockBiomarkerRows: BiomarkerStandardRow[] = [
  {
    id: '1',
    code: 'LDL',
    name: 'LDL Cholesterol',
    aliases: ['Low Density Lipoprotein', 'LDL-C'],
    category: 'lipid_panel',
    standard_unit: 'mg/dL',
    unit_conversions: { 'mmol/L': 38.67 },
    reference_ranges: {
      male: { min: 0, max: 100 },
      female: { min: 0, max: 100 },
    },
    description: 'Bad cholesterol',
    interpretation_guide: null,
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'HDL',
    name: 'HDL Cholesterol',
    aliases: ['High Density Lipoprotein', 'HDL-C'],
    category: 'lipid_panel',
    standard_unit: 'mg/dL',
    unit_conversions: { 'mmol/L': 38.67 },
    reference_ranges: {
      male: { min: 40, max: 60 },
      female: { min: 50, max: 70 },
    },
    description: 'Good cholesterol',
    interpretation_guide: null,
    display_order: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    code: 'GLUCOSE_FASTING',
    name: 'Glucose, Fasting',
    aliases: ['Fasting Blood Sugar', 'FBS', 'Fasting Glucose'],
    category: 'metabolic',
    standard_unit: 'mg/dL',
    unit_conversions: { 'mmol/L': 18.0 },
    reference_ranges: {
      male: { min: 70, max: 100 },
      female: { min: 70, max: 100 },
    },
    description: 'Blood sugar after fasting',
    interpretation_guide: null,
    display_order: 3,
    created_at: '2024-01-01T00:00:00Z',
  },
];

describe('biomarkers API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default chain setup
    mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq });
    mockOrder.mockReturnValue({ data: mockBiomarkerRows, error: null });
    mockEq.mockReturnValue({ order: mockOrder, single: mockSingle });
    mockSingle.mockReturnValue({ data: mockBiomarkerRows[0], error: null });
  });

  describe('getAllBiomarkers', () => {
    it('fetches all biomarkers from biomarker_standards table', async () => {
      const result = await getAllBiomarkers();

      expect(mockFrom).toHaveBeenCalledWith('biomarker_standards');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('display_order');
      expect(result).toHaveLength(3);
    });

    it('transforms rows to BiomarkerStandard objects', async () => {
      const result = await getAllBiomarkers();

      expect(result[0]).toHaveProperty('code', 'LDL');
      expect(result[0]).toHaveProperty('name', 'LDL Cholesterol');
      expect(result[0]).toHaveProperty('standardUnit', 'mg/dL');
      expect(result[0]).toHaveProperty('unitConversions');
      expect(result[0]).toHaveProperty('referenceRanges');
    });

    it('throws error when query fails', async () => {
      mockOrder.mockReturnValue({ data: null, error: { message: 'Database error' } });

      await expect(getAllBiomarkers()).rejects.toThrow('Failed to fetch biomarkers');
    });
  });

  describe('getBiomarkersByCategory', () => {
    it('filters biomarkers by category', async () => {
      mockEq.mockReturnValue({ order: mockOrder });
      mockOrder.mockReturnValue({
        data: mockBiomarkerRows.filter((r) => r.category === 'lipid_panel'),
        error: null,
      });

      const result = await getBiomarkersByCategory('lipid_panel');

      expect(mockEq).toHaveBeenCalledWith('category', 'lipid_panel');
      expect(result).toHaveLength(2);
      expect(result.every((b) => b.category === 'lipid_panel')).toBe(true);
    });

    it('throws error when query fails', async () => {
      mockEq.mockReturnValue({ order: mockOrder });
      mockOrder.mockReturnValue({ data: null, error: { message: 'Database error' } });

      await expect(getBiomarkersByCategory('lipid_panel')).rejects.toThrow(
        'Failed to fetch biomarkers'
      );
    });
  });

  describe('getBiomarkerByCode', () => {
    it('fetches single biomarker by code', async () => {
      const result = await getBiomarkerByCode('LDL');

      expect(mockEq).toHaveBeenCalledWith('code', 'LDL');
      expect(mockSingle).toHaveBeenCalled();
      expect(result?.code).toBe('LDL');
    });

    it('returns null when not found', async () => {
      mockSingle.mockReturnValue({ data: null, error: { code: 'PGRST116' } });

      const result = await getBiomarkerByCode('NONEXISTENT');

      expect(result).toBeNull();
    });

    it('throws error for other query failures', async () => {
      mockSingle.mockReturnValue({ data: null, error: { message: 'Database error' } });

      await expect(getBiomarkerByCode('LDL')).rejects.toThrow('Failed to fetch biomarker');
    });
  });

  describe('searchBiomarkers', () => {
    it('searches by name (case-insensitive)', async () => {
      const result = await searchBiomarkers('ldl');

      expect(result.some((b) => b.name.toLowerCase().includes('ldl'))).toBe(true);
    });

    it('searches by code (case-insensitive)', async () => {
      const result = await searchBiomarkers('HDL');

      expect(result.some((b) => b.code.toLowerCase() === 'hdl')).toBe(true);
    });

    it('searches by aliases', async () => {
      const result = await searchBiomarkers('fasting blood sugar');

      expect(result.some((b) => b.code === 'GLUCOSE_FASTING')).toBe(true);
    });

    it('throws error when query fails', async () => {
      mockOrder.mockReturnValue({ data: null, error: { message: 'Database error' } });

      await expect(searchBiomarkers('test')).rejects.toThrow('Failed to search biomarkers');
    });
  });

  describe('getBiomarkerCategories', () => {
    it('returns unique categories in order', async () => {
      mockSelect.mockReturnValue({ order: mockOrder });
      mockOrder.mockReturnValue({
        data: [{ category: 'lipid_panel' }, { category: 'lipid_panel' }, { category: 'metabolic' }],
        error: null,
      });

      const result = await getBiomarkerCategories();

      expect(result).toEqual(['lipid_panel', 'metabolic']);
    });

    it('throws error when query fails', async () => {
      mockSelect.mockReturnValue({ order: mockOrder });
      mockOrder.mockReturnValue({ data: null, error: { message: 'Database error' } });

      await expect(getBiomarkerCategories()).rejects.toThrow('Failed to fetch categories');
    });
  });

  describe('matchBiomarker', () => {
    beforeEach(() => {
      // matchBiomarker uses select without order, returns data directly
      mockSelect.mockReturnValue({ data: mockBiomarkerRows, error: null });
    });

    it('matches by exact code (case-insensitive)', async () => {
      const result = await matchBiomarker('ldl');

      expect(result?.code).toBe('LDL');
    });

    it('matches by exact name (case-insensitive)', async () => {
      const result = await matchBiomarker('LDL Cholesterol');

      expect(result?.code).toBe('LDL');
    });

    it('matches by alias (case-insensitive)', async () => {
      const result = await matchBiomarker('low density lipoprotein');

      expect(result?.code).toBe('LDL');
    });

    it('matches by partial name', async () => {
      const result = await matchBiomarker('cholesterol');

      // Should match either LDL or HDL
      expect(['LDL', 'HDL']).toContain(result?.code);
    });

    it('returns null when no match found', async () => {
      const result = await matchBiomarker('nonexistent biomarker xyz');

      expect(result).toBeNull();
    });

    it('throws error when query fails', async () => {
      mockSelect.mockReturnValue({ data: null, error: { message: 'Database error' } });

      await expect(matchBiomarker('test')).rejects.toThrow('Failed to match biomarker');
    });
  });
});
