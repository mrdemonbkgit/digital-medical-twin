import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BiomarkersPage } from './BiomarkersPage';

// Mock dependencies
vi.mock('@/components/layout', () => ({
  PageWrapper: ({ children, title }: any) => (
    <div data-testid="page-wrapper" data-title={title}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/common', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children, className, onClick }: any) => (
    <div onClick={onClick} className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
  Input: ({ value, onChange, placeholder, className }: any) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  ),
  LoadingSpinner: ({ className }: { className?: string }) => (
    <div data-testid="loading-spinner" className={className}>
      Loading...
    </div>
  ),
}));

vi.mock('@/hooks/useBiomarkers', () => ({
  useBiomarkers: vi.fn(() => ({
    biomarkers: [],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/types/biomarker', () => ({
  BIOMARKER_CATEGORIES: {
    metabolic: { label: 'Metabolic', description: 'Metabolic biomarkers' },
    lipid_panel: { label: 'Lipid Panel', description: 'Cholesterol and lipids' },
    cbc: { label: 'Complete Blood Count', description: 'Blood cell counts' },
    liver: { label: 'Liver Panel', description: 'Liver function tests' },
    kidney: { label: 'Kidney Panel', description: 'Kidney function tests' },
    electrolyte: { label: 'Electrolytes', description: 'Electrolyte levels' },
    thyroid: { label: 'Thyroid', description: 'Thyroid function' },
    vitamin: { label: 'Vitamins', description: 'Vitamin levels' },
    iron: { label: 'Iron Studies', description: 'Iron metabolism' },
    inflammation: { label: 'Inflammation', description: 'Inflammatory markers' },
    hormone: { label: 'Hormones', description: 'Hormone levels' },
    cardiac: { label: 'Cardiac', description: 'Heart biomarkers' },
    other: { label: 'Other', description: 'Other biomarkers' },
  },
}));

import { useBiomarkers } from '@/hooks/useBiomarkers';

describe('BiomarkersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPage() {
    return render(
      <BrowserRouter>
        <BiomarkersPage />
      </BrowserRouter>
    );
  }

  describe('loading state', () => {
    it('shows loading spinner while loading', () => {
      vi.mocked(useBiomarkers).mockReturnValue({
        biomarkers: [],
        isLoading: true,
        error: null,
      });

      renderPage();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when error occurs', () => {
      vi.mocked(useBiomarkers).mockReturnValue({
        biomarkers: [],
        isLoading: false,
        error: 'Failed to load biomarkers',
      });

      renderPage();

      expect(screen.getByText('Failed to load biomarkers')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders page with zero biomarkers', () => {
      vi.mocked(useBiomarkers).mockReturnValue({
        biomarkers: [],
        isLoading: false,
        error: null,
      });

      renderPage();

      expect(screen.getByTestId('page-wrapper')).toHaveAttribute(
        'data-title',
        'Biomarker Reference'
      );
      expect(screen.getByText('Standardized Biomarkers')).toBeInTheDocument();
    });
  });

  describe('with biomarkers', () => {
    const mockBiomarkers = [
      {
        id: 'glucose',
        code: 'glucose',
        name: 'Glucose',
        category: 'metabolic',
        standardUnit: 'mg/dL',
        description: 'Blood sugar level',
        clinicalSignificance: 'Important for diabetes monitoring',
        aliases: ['Blood Sugar', 'GLU'],
        unitConversions: { 'mmol/L': 0.0555 },
        referenceRanges: {
          male: { low: 70, high: 100 },
          female: { low: 70, high: 100 },
        },
      },
      {
        id: 'cholesterol',
        code: 'cholesterol',
        name: 'Total Cholesterol',
        category: 'lipid_panel',
        standardUnit: 'mg/dL',
        description: 'Total cholesterol level',
        clinicalSignificance: 'Cardiovascular health indicator',
        aliases: ['TC', 'CHOL'],
        unitConversions: {},
        referenceRanges: {
          male: { low: 0, high: 200 },
          female: { low: 0, high: 200 },
        },
      },
      {
        id: 'ldl',
        code: 'ldl',
        name: 'LDL Cholesterol',
        category: 'lipid_panel',
        standardUnit: 'mg/dL',
        description: 'Low-density lipoprotein',
        clinicalSignificance: 'Bad cholesterol',
        aliases: ['LDL-C'],
        unitConversions: {},
        referenceRanges: {
          male: { low: 0, high: 100 },
          female: { low: 0, high: 100 },
        },
      },
    ];

    beforeEach(() => {
      vi.mocked(useBiomarkers).mockReturnValue({
        biomarkers: mockBiomarkers,
        isLoading: false,
        error: null,
      });
    });

    it('displays biomarker count', () => {
      renderPage();

      expect(screen.getByText(/3 biomarkers/)).toBeInTheDocument();
    });

    it('shows search input', () => {
      renderPage();

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search biomarkers...')).toBeInTheDocument();
    });

    it('displays expand all and collapse all buttons', () => {
      renderPage();

      expect(screen.getByText('Expand All')).toBeInTheDocument();
      expect(screen.getByText('Collapse All')).toBeInTheDocument();
    });

    it('displays category headers', () => {
      renderPage();

      expect(screen.getByText('Metabolic')).toBeInTheDocument();
      expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
    });

    it('shows category description and count', () => {
      renderPage();

      expect(screen.getByText(/Metabolic biomarkers.*1 biomarkers/)).toBeInTheDocument();
      expect(screen.getByText(/Cholesterol and lipids.*2 biomarkers/)).toBeInTheDocument();
    });

    it('expands category when clicked', () => {
      renderPage();

      // Click on Metabolic category
      fireEvent.click(screen.getByText('Metabolic'));

      // Should show biomarker
      expect(screen.getByText('Glucose')).toBeInTheDocument();
    });

    it('shows biomarker details when expanded', () => {
      renderPage();

      // Expand Metabolic category
      fireEvent.click(screen.getByText('Metabolic'));

      // Should show glucose biomarker with unit and range
      expect(screen.getByText('Glucose')).toBeInTheDocument();
      expect(screen.getByText('mg/dL')).toBeInTheDocument();
    });

    it('filters biomarkers by search query', () => {
      renderPage();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'glucose' } });

      // Should still show Metabolic category (with Glucose)
      expect(screen.getByText('Metabolic')).toBeInTheDocument();
      // Lipid Panel should not be shown (doesn't match)
      expect(screen.queryByText('Lipid Panel')).not.toBeInTheDocument();
    });

    it('searches by alias', () => {
      renderPage();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Blood Sugar' } });

      // Should show Metabolic (Glucose has "Blood Sugar" alias)
      expect(screen.getByText('Metabolic')).toBeInTheDocument();
    });

    it('shows no results message when search has no matches', () => {
      renderPage();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText(/No biomarkers found matching/)).toBeInTheDocument();
    });

    it('expands all categories when clicking Expand All', () => {
      renderPage();

      fireEvent.click(screen.getByText('Expand All'));

      // All biomarkers should be visible
      expect(screen.getByText('Glucose')).toBeInTheDocument();
      expect(screen.getByText('Total Cholesterol')).toBeInTheDocument();
      expect(screen.getByText('LDL Cholesterol')).toBeInTheDocument();
    });

    it('collapses all categories when clicking Collapse All', () => {
      renderPage();

      // First expand all
      fireEvent.click(screen.getByText('Expand All'));
      expect(screen.getByText('Glucose')).toBeInTheDocument();

      // Then collapse all
      fireEvent.click(screen.getByText('Collapse All'));

      // Biomarker names should not be visible (only category headers)
      expect(screen.queryByText('Glucose')).not.toBeInTheDocument();
    });
  });

  describe('biomarker row details', () => {
    const mockBiomarker = {
      id: 'hemoglobin',
      code: 'hgb',
      name: 'Hemoglobin',
      category: 'cbc',
      standardUnit: 'g/dL',
      description: 'Oxygen-carrying protein in red blood cells',
      clinicalSignificance: 'Indicates anemia or polycythemia',
      aliases: ['HGB', 'Hb'],
      unitConversions: { 'g/L': 0.1 },
      referenceRanges: {
        male: { low: 14, high: 18 },
        female: { low: 12, high: 16 },
      },
    };

    beforeEach(() => {
      vi.mocked(useBiomarkers).mockReturnValue({
        biomarkers: [mockBiomarker],
        isLoading: false,
        error: null,
      });
    });

    it('displays different reference ranges for male and female', () => {
      renderPage();

      // Expand the CBC category
      fireEvent.click(screen.getByText('Complete Blood Count'));

      // Male and Female ranges should be shown separately
      expect(screen.getByText('M:')).toBeInTheDocument();
      expect(screen.getByText('F:')).toBeInTheDocument();
    });

    it('shows biomarker code', () => {
      renderPage();

      fireEvent.click(screen.getByText('Complete Blood Count'));

      expect(screen.getByText('hgb')).toBeInTheDocument();
    });

    it('expands biomarker details when clicking info icon', () => {
      renderPage();

      // Expand category first
      fireEvent.click(screen.getByText('Complete Blood Count'));

      // Click on the biomarker row to show details
      fireEvent.click(screen.getByText('Hemoglobin'));

      // Should show description
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Oxygen-carrying protein in red blood cells')).toBeInTheDocument();
    });

    it('shows clinical significance in expanded details', () => {
      renderPage();

      fireEvent.click(screen.getByText('Complete Blood Count'));
      fireEvent.click(screen.getByText('Hemoglobin'));

      expect(screen.getByText('Clinical Significance')).toBeInTheDocument();
      expect(screen.getByText('Indicates anemia or polycythemia')).toBeInTheDocument();
    });

    it('shows aliases in expanded details', () => {
      renderPage();

      fireEvent.click(screen.getByText('Complete Blood Count'));
      fireEvent.click(screen.getByText('Hemoglobin'));

      expect(screen.getByText('Also Known As')).toBeInTheDocument();
      expect(screen.getByText('HGB')).toBeInTheDocument();
      expect(screen.getByText('Hb')).toBeInTheDocument();
    });

    it('shows unit conversions in expanded details', () => {
      renderPage();

      fireEvent.click(screen.getByText('Complete Blood Count'));
      fireEvent.click(screen.getByText('Hemoglobin'));

      expect(screen.getByText('Unit Conversions')).toBeInTheDocument();
      expect(screen.getByText(/1 g\/L = 0.1 g\/dL/)).toBeInTheDocument();
    });
  });
});
