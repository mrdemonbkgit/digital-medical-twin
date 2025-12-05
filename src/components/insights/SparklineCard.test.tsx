import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SparklineCard } from './SparklineCard';
import type { BiomarkerSummary } from '@/lib/insights/dataProcessing';

// Mock recharts (avoid rendering issues in tests)
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  ReferenceLine: () => <div data-testid="reference-line" />,
}));

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SparklineCard', () => {
  const normalBiomarker: BiomarkerSummary = {
    code: 'glucose',
    name: 'Glucose',
    latestValue: 95,
    unit: 'mg/dL',
    flag: 'normal',
    referenceMin: 70,
    referenceMax: 100,
    dataPoints: [
      { date: '2024-01-01', value: 90 },
      { date: '2024-01-15', value: 95 },
    ],
  };

  const highBiomarker: BiomarkerSummary = {
    code: 'ldl',
    name: 'LDL Cholesterol',
    latestValue: 180,
    unit: 'mg/dL',
    flag: 'high',
    referenceMax: 100,
    dataPoints: [
      { date: '2024-01-01', value: 150 },
      { date: '2024-01-15', value: 180 },
    ],
  };

  const lowBiomarker: BiomarkerSummary = {
    code: 'vitd',
    name: 'Vitamin D',
    latestValue: 15,
    unit: 'ng/mL',
    flag: 'low',
    referenceMin: 30,
    dataPoints: [
      { date: '2024-01-01', value: 20 },
      { date: '2024-01-15', value: 15 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderWithRouter(biomarker: BiomarkerSummary) {
    return render(
      <MemoryRouter>
        <SparklineCard biomarker={biomarker} />
      </MemoryRouter>
    );
  }

  describe('rendering', () => {
    it('renders biomarker name', () => {
      renderWithRouter(normalBiomarker);
      expect(screen.getByText('Glucose')).toBeInTheDocument();
    });

    it('renders latest value', () => {
      renderWithRouter(normalBiomarker);
      expect(screen.getByText('95')).toBeInTheDocument();
    });

    it('renders unit', () => {
      renderWithRouter(normalBiomarker);
      expect(screen.getByText('mg/dL')).toBeInTheDocument();
    });

    it('renders chart with multiple data points', () => {
      renderWithRouter(normalBiomarker);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('renders single dot for single data point', () => {
      const singlePointBiomarker: BiomarkerSummary = {
        ...normalBiomarker,
        dataPoints: [{ date: '2024-01-01', value: 95 }],
      };
      renderWithRouter(singlePointBiomarker);
      // Should show centered dot instead of chart
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('flag states', () => {
    it('shows HIGH badge for high values', () => {
      renderWithRouter(highBiomarker);
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });

    it('shows LOW badge for low values', () => {
      renderWithRouter(lowBiomarker);
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });

    it('shows warning icon for out of range values', () => {
      renderWithRouter(highBiomarker);
      // AlertTriangle icon should be present
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('does not show badge for normal values', () => {
      renderWithRouter(normalBiomarker);
      expect(screen.queryByText('HIGH')).not.toBeInTheDocument();
      expect(screen.queryByText('LOW')).not.toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies red styling for high values', () => {
      renderWithRouter(highBiomarker);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border-red-200');
      expect(button.className).toContain('bg-red-50');
    });

    it('applies normal styling for normal values', () => {
      renderWithRouter(normalBiomarker);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border-gray-200');
      expect(button.className).toContain('bg-white');
    });
  });

  describe('navigation', () => {
    it('navigates to biomarker details on click', () => {
      renderWithRouter(normalBiomarker);
      fireEvent.click(screen.getByRole('button'));
      expect(mockNavigate).toHaveBeenCalledWith('/insights/glucose');
    });

    it('uses correct code for navigation', () => {
      renderWithRouter(highBiomarker);
      fireEvent.click(screen.getByRole('button'));
      expect(mockNavigate).toHaveBeenCalledWith('/insights/ldl');
    });
  });
});
