import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { InsightsPage } from './InsightsPage';

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
  LoadingSpinner: ({ className }: { className?: string }) => (
    <div data-testid="loading-spinner" className={className}>
      Loading...
    </div>
  ),
}));

const mockSetVisibleCategories = vi.fn();
vi.mock('@/components/insights', () => ({
  FlagsBanner: ({ flagCounts }: any) => (
    <div data-testid="flags-banner">
      {flagCounts.high > 0 && <span>High: {flagCounts.high}</span>}
      {flagCounts.low > 0 && <span>Low: {flagCounts.low}</span>}
    </div>
  ),
  TimeRangeFilter: ({ value, onChange }: any) => (
    <div data-testid="time-range-filter">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid="time-range-select"
      >
        <option value="3m">3 months</option>
        <option value="6m">6 months</option>
        <option value="1y">1 year</option>
        <option value="all">All time</option>
      </select>
    </div>
  ),
  CategoryFilter: ({ availableCategories, visibleCategories, onChange }: any) => (
    <div data-testid="category-filter">
      {availableCategories.map((cat: string) => (
        <button
          key={cat}
          data-testid={`category-toggle-${cat}`}
          onClick={() => {
            const newVisible = visibleCategories.includes(cat)
              ? visibleCategories.filter((c: string) => c !== cat)
              : [...visibleCategories, cat];
            onChange(newVisible);
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  ),
  CategorySection: ({ category, biomarkers }: any) => (
    <div data-testid={`category-section-${category}`}>
      <h3>{category}</h3>
      {biomarkers.map((b: any) => (
        <div key={b.biomarkerCode}>{b.biomarkerName}</div>
      ))}
    </div>
  ),
  useVisibleCategories: vi.fn((categories) => [categories, mockSetVisibleCategories]),
}));

vi.mock('@/hooks/useBiomarkerTrends', () => ({
  useBiomarkerTrends: vi.fn(() => ({
    summaries: [],
    groupedByCategory: {},
    flagCounts: { high: 0, low: 0, critical: 0 },
    categoriesWithData: [],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/types/biomarker', () => ({
  BIOMARKER_CATEGORIES: {
    metabolic: { label: 'Metabolic', description: 'Metabolic biomarkers' },
    lipid_panel: { label: 'Lipid Panel', description: 'Cholesterol and lipids' },
    cbc: { label: 'Complete Blood Count', description: 'Blood cell counts' },
  },
}));

import { useBiomarkerTrends } from '@/hooks/useBiomarkerTrends';
import { useVisibleCategories } from '@/components/insights';

describe('InsightsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPage() {
    return render(
      <BrowserRouter>
        <InsightsPage />
      </BrowserRouter>
    );
  }

  describe('loading state', () => {
    it('shows loading spinner while loading', () => {
      vi.mocked(useBiomarkerTrends).mockReturnValue({
        summaries: [],
        groupedByCategory: {},
        flagCounts: { high: 0, low: 0, critical: 0 },
        categoriesWithData: [],
        isLoading: true,
        error: null,
      });

      renderPage();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when error occurs', () => {
      vi.mocked(useBiomarkerTrends).mockReturnValue({
        summaries: [],
        groupedByCategory: {},
        flagCounts: { high: 0, low: 0, critical: 0 },
        categoriesWithData: [],
        isLoading: false,
        error: 'Failed to load biomarker trends',
      });

      renderPage();

      expect(screen.getByText('Failed to load biomarker trends')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no biomarker data', () => {
      vi.mocked(useBiomarkerTrends).mockReturnValue({
        summaries: [],
        groupedByCategory: {},
        flagCounts: { high: 0, low: 0, critical: 0 },
        categoriesWithData: [],
        isLoading: false,
        error: null,
      });

      renderPage();

      expect(screen.getByText('No biomarker data yet')).toBeInTheDocument();
      expect(
        screen.getByText(/Upload lab results to start tracking/)
      ).toBeInTheDocument();
    });
  });

  describe('with biomarker data', () => {
    const mockSummaries = [
      {
        biomarkerCode: 'glucose',
        biomarkerName: 'Glucose',
        category: 'metabolic',
        latestValue: 95,
        unit: 'mg/dL',
        trend: 'stable',
        dataPoints: 5,
      },
      {
        biomarkerCode: 'cholesterol',
        biomarkerName: 'Total Cholesterol',
        category: 'lipid_panel',
        latestValue: 180,
        unit: 'mg/dL',
        trend: 'decreasing',
        dataPoints: 3,
      },
    ];

    beforeEach(() => {
      vi.mocked(useBiomarkerTrends).mockReturnValue({
        summaries: mockSummaries,
        groupedByCategory: {
          metabolic: [mockSummaries[0]],
          lipid_panel: [mockSummaries[1]],
        },
        flagCounts: { high: 1, low: 0, critical: 0 },
        categoriesWithData: ['metabolic', 'lipid_panel'],
        isLoading: false,
        error: null,
      });

      vi.mocked(useVisibleCategories).mockReturnValue([
        ['metabolic', 'lipid_panel'],
        mockSetVisibleCategories,
      ]);
    });

    it('renders page title', () => {
      renderPage();

      expect(screen.getByTestId('page-wrapper')).toHaveAttribute('data-title', 'Insights');
    });

    it('shows biomarker count', () => {
      renderPage();

      expect(screen.getByText(/Tracking 2 biomarkers/)).toBeInTheDocument();
    });

    it('shows time range filter', () => {
      renderPage();

      expect(screen.getByTestId('time-range-filter')).toBeInTheDocument();
    });

    it('shows category filter', () => {
      renderPage();

      expect(screen.getByTestId('category-filter')).toBeInTheDocument();
    });

    it('shows flags banner', () => {
      renderPage();

      expect(screen.getByTestId('flags-banner')).toBeInTheDocument();
      expect(screen.getByText('High: 1')).toBeInTheDocument();
    });

    it('renders category sections', () => {
      renderPage();

      expect(screen.getByTestId('category-section-metabolic')).toBeInTheDocument();
      expect(screen.getByTestId('category-section-lipid_panel')).toBeInTheDocument();
    });

    it('shows biomarker names in category sections', () => {
      renderPage();

      expect(screen.getByText('Glucose')).toBeInTheDocument();
      expect(screen.getByText('Total Cholesterol')).toBeInTheDocument();
    });
  });

  describe('time range filtering', () => {
    beforeEach(() => {
      vi.mocked(useBiomarkerTrends).mockReturnValue({
        summaries: [{ biomarkerCode: 'glucose', biomarkerName: 'Glucose', category: 'metabolic' }],
        groupedByCategory: {
          metabolic: [{ biomarkerCode: 'glucose', biomarkerName: 'Glucose', category: 'metabolic' }],
        },
        flagCounts: { high: 0, low: 0, critical: 0 },
        categoriesWithData: ['metabolic'],
        isLoading: false,
        error: null,
      });

      vi.mocked(useVisibleCategories).mockReturnValue([['metabolic'], mockSetVisibleCategories]);
    });

    it('changes time range when filter changed', () => {
      renderPage();

      const select = screen.getByTestId('time-range-select');
      fireEvent.change(select, { target: { value: '6m' } });

      // The hook should be called with new time range on next render
      expect(select).toHaveValue('6m');
    });
  });

  describe('category filtering', () => {
    beforeEach(() => {
      vi.mocked(useBiomarkerTrends).mockReturnValue({
        summaries: [
          { biomarkerCode: 'glucose', biomarkerName: 'Glucose', category: 'metabolic' },
          { biomarkerCode: 'cholesterol', biomarkerName: 'Cholesterol', category: 'lipid_panel' },
        ],
        groupedByCategory: {
          metabolic: [{ biomarkerCode: 'glucose', biomarkerName: 'Glucose', category: 'metabolic' }],
          lipid_panel: [
            { biomarkerCode: 'cholesterol', biomarkerName: 'Cholesterol', category: 'lipid_panel' },
          ],
        },
        flagCounts: { high: 0, low: 0, critical: 0 },
        categoriesWithData: ['metabolic', 'lipid_panel'],
        isLoading: false,
        error: null,
      });

      vi.mocked(useVisibleCategories).mockReturnValue([
        ['metabolic', 'lipid_panel'],
        mockSetVisibleCategories,
      ]);
    });

    it('can toggle category visibility', () => {
      renderPage();

      fireEvent.click(screen.getByTestId('category-toggle-metabolic'));

      expect(mockSetVisibleCategories).toHaveBeenCalledWith(['lipid_panel']);
    });
  });

  describe('no visible categories', () => {
    it('shows message when no categories selected', () => {
      vi.mocked(useBiomarkerTrends).mockReturnValue({
        summaries: [{ biomarkerCode: 'glucose', biomarkerName: 'Glucose', category: 'metabolic' }],
        groupedByCategory: {
          metabolic: [{ biomarkerCode: 'glucose', biomarkerName: 'Glucose', category: 'metabolic' }],
        },
        flagCounts: { high: 0, low: 0, critical: 0 },
        categoriesWithData: ['metabolic'],
        isLoading: false,
        error: null,
      });

      vi.mocked(useVisibleCategories).mockReturnValue([[], mockSetVisibleCategories]);

      renderPage();

      expect(
        screen.getByText(/No categories selected/)
      ).toBeInTheDocument();
    });
  });

  describe('flag counts', () => {
    it('displays flag counts in banner', () => {
      vi.mocked(useBiomarkerTrends).mockReturnValue({
        summaries: [{ biomarkerCode: 'glucose', biomarkerName: 'Glucose', category: 'metabolic' }],
        groupedByCategory: {
          metabolic: [{ biomarkerCode: 'glucose', biomarkerName: 'Glucose', category: 'metabolic' }],
        },
        flagCounts: { high: 3, low: 2, critical: 0 },
        categoriesWithData: ['metabolic'],
        isLoading: false,
        error: null,
      });

      vi.mocked(useVisibleCategories).mockReturnValue([['metabolic'], mockSetVisibleCategories]);

      renderPage();

      expect(screen.getByText('High: 3')).toBeInTheDocument();
      expect(screen.getByText('Low: 2')).toBeInTheDocument();
    });
  });
});
