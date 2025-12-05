import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySection } from './CategorySection';
import type { BiomarkerCategory } from '@/types/biomarker';
import type { BiomarkerSummary } from '@/lib/insights/dataProcessing';

// Mock SparklineCard
vi.mock('./SparklineCard', () => ({
  SparklineCard: ({ biomarker }: { biomarker: BiomarkerSummary }) => (
    <div data-testid={`sparkline-${biomarker.code}`}>{biomarker.name}</div>
  ),
}));

// Mock BIOMARKER_CATEGORIES
vi.mock('@/types/biomarker', async () => {
  const actual = await vi.importActual('@/types/biomarker');
  return {
    ...actual,
    BIOMARKER_CATEGORIES: {
      metabolic: { label: 'Metabolic Panel', description: 'Metabolic biomarkers' },
      lipid: { label: 'Lipid Panel', description: 'Lipid biomarkers' },
      cbc: { label: 'Complete Blood Count', description: 'CBC biomarkers' },
    },
  };
});

describe('CategorySection', () => {
  const createBiomarker = (code: string, name: string): BiomarkerSummary => ({
    code,
    name,
    category: 'metabolic',
    latestValue: 100,
    unit: 'mg/dL',
    latestDate: '2024-06-15',
    dataPoints: [{ date: '2024-06-15', value: 100 }],
    trend: 'stable',
    flag: null,
  });

  const defaultProps = {
    category: 'metabolic' as BiomarkerCategory,
    biomarkers: [
      createBiomarker('glucose', 'Glucose'),
      createBiomarker('a1c', 'Hemoglobin A1C'),
    ],
  };

  describe('header', () => {
    it('renders category label', () => {
      render(<CategorySection {...defaultProps} />);

      expect(screen.getByText('Metabolic Panel')).toBeInTheDocument();
    });

    it('renders biomarker count for single item', () => {
      render(
        <CategorySection
          category="metabolic"
          biomarkers={[createBiomarker('glucose', 'Glucose')]}
        />
      );

      expect(screen.getByText('1 biomarker')).toBeInTheDocument();
    });

    it('renders biomarker count for multiple items', () => {
      render(<CategorySection {...defaultProps} />);

      expect(screen.getByText('2 biomarkers')).toBeInTheDocument();
    });

    it('falls back to category key when no label found', () => {
      render(
        <CategorySection
          category={'unknown' as BiomarkerCategory}
          biomarkers={[createBiomarker('test', 'Test')]}
        />
      );

      expect(screen.getByText('unknown')).toBeInTheDocument();
    });
  });

  describe('expand/collapse', () => {
    it('starts expanded by default', () => {
      render(<CategorySection {...defaultProps} />);

      expect(screen.getByTestId('sparkline-glucose')).toBeInTheDocument();
      expect(screen.getByTestId('sparkline-a1c')).toBeInTheDocument();
    });

    it('collapses when clicking header', () => {
      render(<CategorySection {...defaultProps} />);

      const header = screen.getByText('Metabolic Panel').closest('button')!;
      fireEvent.click(header);

      expect(screen.queryByTestId('sparkline-glucose')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sparkline-a1c')).not.toBeInTheDocument();
    });

    it('expands again when clicking header twice', () => {
      render(<CategorySection {...defaultProps} />);

      const header = screen.getByText('Metabolic Panel').closest('button')!;
      fireEvent.click(header); // collapse
      fireEvent.click(header); // expand

      expect(screen.getByTestId('sparkline-glucose')).toBeInTheDocument();
    });

    it('rotates chevron when expanded', () => {
      const { container } = render(<CategorySection {...defaultProps} />);

      const chevron = container.querySelector('svg');
      expect(chevron).toHaveClass('rotate-180');
    });

    it('removes rotation when collapsed', () => {
      const { container } = render(<CategorySection {...defaultProps} />);

      const header = screen.getByText('Metabolic Panel').closest('button')!;
      fireEvent.click(header);

      const chevron = container.querySelector('svg');
      expect(chevron).not.toHaveClass('rotate-180');
    });
  });

  describe('biomarker cards', () => {
    it('renders SparklineCard for each biomarker', () => {
      render(<CategorySection {...defaultProps} />);

      expect(screen.getByTestId('sparkline-glucose')).toBeInTheDocument();
      expect(screen.getByTestId('sparkline-a1c')).toBeInTheDocument();
    });

    it('displays biomarker name from SparklineCard', () => {
      render(<CategorySection {...defaultProps} />);

      expect(screen.getByText('Glucose')).toBeInTheDocument();
      expect(screen.getByText('Hemoglobin A1C')).toBeInTheDocument();
    });

    it('renders empty grid when no biomarkers (expanded)', () => {
      const { container } = render(
        <CategorySection category="metabolic" biomarkers={[]} />
      );

      // Grid container should exist but be empty
      const grid = container.querySelector('.grid');
      expect(grid?.children.length).toBe(0);
    });
  });

  describe('different categories', () => {
    it('renders lipid category', () => {
      render(
        <CategorySection
          category="lipid"
          biomarkers={[createBiomarker('ldl', 'LDL Cholesterol')]}
        />
      );

      expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
    });

    it('renders cbc category', () => {
      render(
        <CategorySection
          category="cbc"
          biomarkers={[createBiomarker('wbc', 'White Blood Cells')]}
        />
      );

      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('renders with border and rounded corners', () => {
      const { container } = render(<CategorySection {...defaultProps} />);

      const section = container.firstChild as HTMLElement;
      expect(section).toHaveClass('rounded-lg', 'border', 'border-gray-200');
    });

    it('renders header button with full width', () => {
      render(<CategorySection {...defaultProps} />);

      const header = screen.getByText('Metabolic Panel').closest('button')!;
      expect(header).toHaveClass('w-full');
    });
  });
});
