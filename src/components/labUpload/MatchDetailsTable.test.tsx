import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchDetailsTable } from './MatchDetailsTable';
import type { BiomarkerMatchDetail } from '@/types';

describe('MatchDetailsTable', () => {
  const createMatchDetail = (overrides: Partial<BiomarkerMatchDetail> = {}): BiomarkerMatchDetail => ({
    originalName: 'Glucose',
    matchedCode: 'glucose',
    matchedName: 'Glucose',
    validationIssues: [],
    ...overrides,
  });

  describe('header', () => {
    it('renders title', () => {
      render(<MatchDetailsTable matchDetails={[createMatchDetail()]} />);

      expect(screen.getByText('Biomarker Matching Details')).toBeInTheDocument();
    });

    it('shows matched count', () => {
      const details = [
        createMatchDetail({ matchedCode: 'glucose' }),
        createMatchDetail({ originalName: 'A1C', matchedCode: 'hba1c', matchedName: 'HbA1c' }),
      ];

      render(<MatchDetailsTable matchDetails={details} />);

      expect(screen.getByText('2 matched')).toBeInTheDocument();
    });

    it('shows unmatched count when present', () => {
      const details = [
        createMatchDetail({ matchedCode: 'glucose' }),
        createMatchDetail({ originalName: 'Unknown', matchedCode: null, matchedName: null }),
      ];

      render(<MatchDetailsTable matchDetails={details} />);

      expect(screen.getByText('1 unmatched')).toBeInTheDocument();
    });

    it('does not show unmatched count when none', () => {
      const details = [createMatchDetail()];

      render(<MatchDetailsTable matchDetails={details} />);

      expect(screen.queryByText(/unmatched/)).not.toBeInTheDocument();
    });
  });

  describe('table columns', () => {
    it('renders all column headers', () => {
      render(<MatchDetailsTable matchDetails={[createMatchDetail()]} />);

      expect(screen.getByText('Original Name')).toBeInTheDocument();
      expect(screen.getByText('Matched To')).toBeInTheDocument();
      expect(screen.getByText('Conversion')).toBeInTheDocument();
      expect(screen.getByText('Issues')).toBeInTheDocument();
    });
  });

  describe('matched rows', () => {
    it('displays original name', () => {
      render(<MatchDetailsTable matchDetails={[createMatchDetail({ originalName: 'Blood Sugar' })]} />);

      expect(screen.getByText('Blood Sugar')).toBeInTheDocument();
    });

    it('displays matched name and code', () => {
      render(
        <MatchDetailsTable
          matchDetails={[createMatchDetail({ matchedCode: 'hba1c', matchedName: 'Hemoglobin A1c' })]}
        />
      );

      expect(screen.getByText('Hemoglobin A1c')).toBeInTheDocument();
      expect(screen.getByText('hba1c')).toBeInTheDocument();
    });

    it('shows "No conversion" when no conversion applied', () => {
      render(<MatchDetailsTable matchDetails={[createMatchDetail()]} />);

      expect(screen.getByText('No conversion')).toBeInTheDocument();
    });
  });

  describe('unmatched rows', () => {
    it('shows "No match" for unmatched items', () => {
      const unmatched = createMatchDetail({
        originalName: 'Unknown Marker',
        matchedCode: null,
        matchedName: null,
      });

      render(<MatchDetailsTable matchDetails={[unmatched]} />);

      expect(screen.getByText('No match')).toBeInTheDocument();
    });

    it('applies warning background styling to unmatched rows', () => {
      const unmatched = createMatchDetail({
        matchedCode: null,
        matchedName: null,
      });

      const { container } = render(<MatchDetailsTable matchDetails={[unmatched]} />);

      const row = container.querySelector('tbody tr');
      expect(row).toHaveClass('bg-warning-muted/50');
    });
  });

  describe('conversions', () => {
    it('displays conversion details when applied', () => {
      const withConversion = createMatchDetail({
        conversionApplied: {
          fromValue: 100,
          fromUnit: 'mg/dL',
          toValue: 5.55,
          toUnit: 'mmol/L',
        },
      });

      render(<MatchDetailsTable matchDetails={[withConversion]} />);

      expect(screen.getByText(/100 mg\/dL/)).toBeInTheDocument();
      expect(screen.getByText(/5\.55 mmol\/L/)).toBeInTheDocument();
    });
  });

  describe('validation issues', () => {
    it('displays validation issues when present', () => {
      const withIssues = createMatchDetail({
        validationIssues: ['Value out of range', 'Missing reference range'],
      });

      render(<MatchDetailsTable matchDetails={[withIssues]} />);

      expect(screen.getByText(/Value out of range/)).toBeInTheDocument();
    });

    it('shows dash when no issues', () => {
      render(<MatchDetailsTable matchDetails={[createMatchDetail()]} />);

      // The dash character for no issues
      const cells = screen.getAllByText('-');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('multiple rows', () => {
    it('renders all match details', () => {
      const details = [
        createMatchDetail({ originalName: 'Blood Sugar', matchedCode: 'glucose', matchedName: 'Glucose' }),
        createMatchDetail({ originalName: 'Cholesterol', matchedCode: 'cholesterol', matchedName: 'Total Cholesterol' }),
        createMatchDetail({ originalName: 'Unknown', matchedCode: null, matchedName: null }),
      ];

      render(<MatchDetailsTable matchDetails={details} />);

      expect(screen.getByText('Blood Sugar')).toBeInTheDocument();
      expect(screen.getByText('Cholesterol')).toBeInTheDocument();
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });
});
