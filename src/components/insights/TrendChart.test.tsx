import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendChart } from './TrendChart';
import type { BiomarkerSummary } from '@/lib/insights/dataProcessing';

// Mock recharts to avoid rendering issues
vi.mock('recharts', () => ({
  LineChart: ({ children, data, margin }: any) => (
    <div data-testid="line-chart" data-points={data?.length} data-margin={JSON.stringify(margin)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke, strokeWidth }: any) => (
    <div data-testid="line" data-datakey={dataKey} data-stroke={stroke} data-strokewidth={strokeWidth} />
  ),
  XAxis: ({ dataKey, tickFormatter }: any) => (
    <div data-testid="x-axis" data-datakey={dataKey} />
  ),
  YAxis: ({ domain }: any) => (
    <div data-testid="y-axis" data-domain={JSON.stringify(domain)} />
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ content }: any) => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children, width, height }: any) => (
    <div data-testid="responsive-container" data-width={width} data-height={height}>
      {children}
    </div>
  ),
  ReferenceArea: ({ y1, y2, fill }: any) => (
    <div data-testid="reference-area" data-y1={y1} data-y2={y2} data-fill={fill} />
  ),
  ReferenceLine: ({ y, stroke, label }: any) => (
    <div data-testid="reference-line" data-y={y} data-stroke={stroke} data-label={label?.value} />
  ),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    if (formatStr === 'MMM d, yyyy') return 'Jan 15, 2024';
    if (formatStr === 'MMM d') return 'Jan 15';
    return date.toISOString();
  },
  parseISO: (dateStr: string) => new Date(dateStr),
}));

describe('TrendChart', () => {
  const normalBiomarker: BiomarkerSummary = {
    code: 'glucose',
    name: 'Glucose',
    latestValue: 95,
    unit: 'mg/dL',
    flag: 'normal',
    referenceMin: 70,
    referenceMax: 100,
    dataPoints: [
      { date: '2024-01-01', value: 90, flag: 'normal' },
      { date: '2024-01-15', value: 95, flag: 'normal' },
      { date: '2024-02-01', value: 92, flag: 'normal' },
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
      { date: '2024-01-01', value: 150, flag: 'high' },
      { date: '2024-01-15', value: 180, flag: 'high' },
    ],
  };

  const noRefRangeBiomarker: BiomarkerSummary = {
    code: 'custom',
    name: 'Custom Marker',
    latestValue: 50,
    unit: 'units',
    flag: 'normal',
    dataPoints: [
      { date: '2024-01-01', value: 45 },
      { date: '2024-01-15', value: 50 },
    ],
  };

  describe('rendering', () => {
    it('renders responsive container', () => {
      render(<TrendChart biomarker={normalBiomarker} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('renders line chart with data', () => {
      render(<TrendChart biomarker={normalBiomarker} />);
      const chart = screen.getByTestId('line-chart');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveAttribute('data-points', '3');
    });

    it('renders cartesian grid', () => {
      render(<TrendChart biomarker={normalBiomarker} />);
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });

    it('renders X axis with date datakey', () => {
      render(<TrendChart biomarker={normalBiomarker} />);
      const xAxis = screen.getByTestId('x-axis');
      expect(xAxis).toHaveAttribute('data-datakey', 'date');
    });

    it('renders Y axis', () => {
      render(<TrendChart biomarker={normalBiomarker} />);
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });

    it('renders data line with value datakey', () => {
      render(<TrendChart biomarker={normalBiomarker} />);
      const line = screen.getByTestId('line');
      expect(line).toHaveAttribute('data-datakey', 'value');
    });

    it('renders tooltip', () => {
      render(<TrendChart biomarker={normalBiomarker} />);
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  describe('reference range', () => {
    it('renders reference area when both min and max defined', () => {
      render(<TrendChart biomarker={normalBiomarker} />);
      const refArea = screen.getByTestId('reference-area');
      expect(refArea).toBeInTheDocument();
      expect(refArea).toHaveAttribute('data-y1', '70');
      expect(refArea).toHaveAttribute('data-y2', '100');
    });

    it('renders reference lines for min and max', () => {
      render(<TrendChart biomarker={normalBiomarker} />);
      const refLines = screen.getAllByTestId('reference-line');
      expect(refLines.length).toBe(2);
      expect(refLines[0]).toHaveAttribute('data-label', 'Min: 70');
      expect(refLines[1]).toHaveAttribute('data-label', 'Max: 100');
    });

    it('does not render reference area when no range defined', () => {
      render(<TrendChart biomarker={noRefRangeBiomarker} />);
      expect(screen.queryByTestId('reference-area')).not.toBeInTheDocument();
    });

    it('renders only max reference line when only max defined', () => {
      render(<TrendChart biomarker={highBiomarker} />);
      const refLines = screen.getAllByTestId('reference-line');
      expect(refLines.length).toBe(1);
      expect(refLines[0]).toHaveAttribute('data-label', 'Max: 100');
    });
  });

  describe('Y axis domain calculation', () => {
    it('includes reference range in Y axis domain', () => {
      render(<TrendChart biomarker={normalBiomarker} />);
      const yAxis = screen.getByTestId('y-axis');
      const domain = JSON.parse(yAxis.getAttribute('data-domain') || '[]');
      // Domain should include reference range with padding
      expect(domain[0]).toBeLessThanOrEqual(70);
      expect(domain[1]).toBeGreaterThanOrEqual(100);
    });

    it('extends domain to include data points outside reference range', () => {
      const biomarkerWithOutlier: BiomarkerSummary = {
        ...normalBiomarker,
        dataPoints: [
          { date: '2024-01-01', value: 50, flag: 'low' },
          { date: '2024-01-15', value: 150, flag: 'high' },
        ],
      };
      render(<TrendChart biomarker={biomarkerWithOutlier} />);
      const yAxis = screen.getByTestId('y-axis');
      const domain = JSON.parse(yAxis.getAttribute('data-domain') || '[]');
      expect(domain[0]).toBeLessThanOrEqual(50);
      expect(domain[1]).toBeGreaterThanOrEqual(150);
    });
  });

  describe('line styling', () => {
    it('uses accent stroke color for data line', () => {
      render(<TrendChart biomarker={normalBiomarker} />);
      const line = screen.getByTestId('line');
      expect(line).toHaveAttribute('data-stroke', 'var(--accent-primary)');
    });

    it('uses stroke width of 2', () => {
      render(<TrendChart biomarker={normalBiomarker} />);
      const line = screen.getByTestId('line');
      expect(line).toHaveAttribute('data-strokewidth', '2');
    });
  });

  describe('container sizing', () => {
    it('uses 100% width', () => {
      render(<TrendChart biomarker={normalBiomarker} />);
      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveAttribute('data-width', '100%');
    });

    it('uses 100% height', () => {
      render(<TrendChart biomarker={normalBiomarker} />);
      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveAttribute('data-height', '100%');
    });
  });
});
