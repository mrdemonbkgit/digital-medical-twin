import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InsightsDetailPage } from './InsightsDetailPage';

// Mock the hooks
vi.mock('@/hooks/useBiomarkerDetail', () => ({
  useBiomarkerDetail: vi.fn(),
}));

// Mock components
vi.mock('@/components/layout', () => ({
  PageWrapper: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-wrapper" data-title={title}>{children}</div>
  ),
}));

vi.mock('@/components/common', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LoadingSpinner: ({ className }: { className?: string }) => <div data-testid="loading-spinner" className={className}>Loading...</div>,
}));

vi.mock('@/components/insights', () => ({
  TimeRangeFilter: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select data-testid="time-range-filter" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="1y">1 Year</option>
    </select>
  ),
  TrendChart: ({ biomarker }: { biomarker: unknown }) => (
    <div data-testid="trend-chart">Chart for {(biomarker as { name: string }).name}</div>
  ),
  StatsPanel: ({ stats, unit }: { stats: unknown; unit: string }) => (
    <div data-testid="stats-panel">Stats in {unit}</div>
  ),
}));

import { useBiomarkerDetail } from '@/hooks/useBiomarkerDetail';

const mockUseBiomarkerDetail = vi.mocked(useBiomarkerDetail);

const renderWithRouter = (code: string = 'glucose') => {
  return render(
    <MemoryRouter initialEntries={[`/insights/${code}`]}>
      <Routes>
        <Route path="/insights/:code" element={<InsightsDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('InsightsDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading spinner when loading', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: null,
        stats: null,
        standard: null,
        isLoading: true,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when error occurs', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: null,
        stats: null,
        standard: null,
        isLoading: false,
        error: 'Failed to load biomarker data',
      });

      renderWithRouter();

      expect(screen.getByText('Failed to load biomarker data')).toBeInTheDocument();
    });
  });

  describe('no data state', () => {
    it('shows no data message when timeSeries is null', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: null,
        stats: null,
        standard: null,
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('No data found in selected time range')).toBeInTheDocument();
      expect(screen.getByText(/Try selecting a longer time range/)).toBeInTheDocument();
    });

    it('shows back link in no data state', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: null,
        stats: null,
        standard: null,
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('Back to Insights')).toBeInTheDocument();
    });
  });

  describe('data loaded state', () => {
    const mockTimeSeries = {
      code: 'glucose',
      name: 'Glucose',
      unit: 'mg/dL',
      category: 'metabolic',
      flag: null,
      referenceMin: 70,
      referenceMax: 100,
      dataPoints: [
        { date: '2024-01-01', value: 85 },
        { date: '2024-02-01', value: 90 },
      ],
    };

    const mockStats = {
      min: 85,
      max: 90,
      avg: 87.5,
      latest: 90,
      trend: 'stable',
    };

    it('renders biomarker name as title', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: mockTimeSeries,
        stats: mockStats,
        standard: null,
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('Glucose')).toBeInTheDocument();
    });

    it('renders trend chart', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: mockTimeSeries,
        stats: mockStats,
        standard: null,
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    });

    it('renders stats panel when stats available', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: mockTimeSeries,
        stats: mockStats,
        standard: null,
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByTestId('stats-panel')).toBeInTheDocument();
    });

    it('renders time range filter', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: mockTimeSeries,
        stats: mockStats,
        standard: null,
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByTestId('time-range-filter')).toBeInTheDocument();
    });

    it('shows reference range information', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: mockTimeSeries,
        stats: mockStats,
        standard: null,
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('Reference Range')).toBeInTheDocument();
      expect(screen.getByText('70 - 100 mg/dL')).toBeInTheDocument();
    });

    it('shows data points count', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: mockTimeSeries,
        stats: mockStats,
        standard: null,
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('Data Points')).toBeInTheDocument();
      expect(screen.getByText('2 measurements')).toBeInTheDocument();
    });

    it('shows singular measurement for single data point', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: { ...mockTimeSeries, dataPoints: [{ date: '2024-01-01', value: 85 }] },
        stats: mockStats,
        standard: null,
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('1 measurement')).toBeInTheDocument();
    });
  });

  describe('flag alerts', () => {
    const baseTimeSeries = {
      code: 'glucose',
      name: 'Glucose',
      unit: 'mg/dL',
      category: 'metabolic',
      referenceMin: 70,
      referenceMax: 100,
      dataPoints: [{ date: '2024-01-01', value: 85 }],
    };

    it('shows high alert when flag is high', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: { ...baseTimeSeries, flag: 'high' },
        stats: null,
        standard: null,
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText(/Latest value is above the reference range/)).toBeInTheDocument();
    });

    it('shows low alert when flag is low', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: { ...baseTimeSeries, flag: 'low' },
        stats: null,
        standard: null,
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText(/Latest value is below the reference range/)).toBeInTheDocument();
    });

    it('does not show alert when flag is null', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: { ...baseTimeSeries, flag: null },
        stats: null,
        standard: null,
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.queryByText(/Latest value is/)).not.toBeInTheDocument();
    });
  });

  describe('standard information', () => {
    const mockTimeSeries = {
      code: 'glucose',
      name: 'Glucose',
      unit: 'mg/dL',
      category: 'metabolic',
      flag: null,
      referenceMin: 70,
      referenceMax: 100,
      dataPoints: [{ date: '2024-01-01', value: 85 }],
    };

    it('shows clinical significance when available', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: mockTimeSeries,
        stats: null,
        standard: {
          clinicalSignificance: 'Important for diabetes monitoring',
          description: null,
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('Clinical Significance')).toBeInTheDocument();
      expect(screen.getByText('Important for diabetes monitoring')).toBeInTheDocument();
    });

    it('shows description when available', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: mockTimeSeries,
        stats: null,
        standard: {
          clinicalSignificance: null,
          description: 'Blood sugar level measurement',
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Blood sugar level measurement')).toBeInTheDocument();
    });
  });

  describe('reference range edge cases', () => {
    it('shows "Not available" when reference range is undefined', () => {
      mockUseBiomarkerDetail.mockReturnValue({
        timeSeries: {
          code: 'glucose',
          name: 'Glucose',
          unit: 'mg/dL',
          category: 'metabolic',
          flag: null,
          referenceMin: undefined,
          referenceMax: undefined,
          dataPoints: [{ date: '2024-01-01', value: 85 }],
        },
        stats: null,
        standard: null,
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('Not available')).toBeInTheDocument();
    });
  });
});
