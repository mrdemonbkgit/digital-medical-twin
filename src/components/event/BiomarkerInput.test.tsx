import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BiomarkerInput } from './BiomarkerInput';
import type { Biomarker, BiomarkerStandard } from '@/types';

// Mock components
vi.mock('@/components/common', () => ({
  Button: ({ children, onClick, disabled, variant, size, className, type }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} className={className} type={type}>
      {children}
    </button>
  ),
  Input: ({ label, value, onChange, disabled, type, step, className }: any) => (
    <div>
      <label>{label}</label>
      <input
        type={type || 'text'}
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={className}
        data-testid={`input-${label?.toLowerCase()}`}
      />
    </div>
  ),
}));

vi.mock('./BiomarkerSelect', () => ({
  BiomarkerSelect: ({ biomarkers, value, onChange, excludeCodes }: any) => (
    <div data-testid="biomarker-select">
      <select
        value={value || ''}
        onChange={(e) => {
          const standard = biomarkers.find((b: BiomarkerStandard) => b.code === e.target.value);
          onChange(standard || null);
        }}
        data-testid="biomarker-dropdown"
      >
        <option value="">Select biomarker</option>
        {biomarkers
          .filter((b: BiomarkerStandard) => !excludeCodes?.includes(b.code))
          .map((b: BiomarkerStandard) => (
            <option key={b.code} value={b.code}>{b.name}</option>
          ))}
      </select>
    </div>
  ),
}));

vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('BiomarkerInput', () => {
  const mockOnChange = vi.fn();

  const mockStandards: BiomarkerStandard[] = [
    {
      code: 'glucose',
      name: 'Glucose',
      standardUnit: 'mg/dL',
      category: 'metabolic',
      referenceRanges: {
        male: { low: 70, high: 100 },
        female: { low: 70, high: 100 },
      },
    },
    {
      code: 'hba1c',
      name: 'HbA1c',
      standardUnit: '%',
      category: 'metabolic',
      referenceRanges: {
        male: { low: 4.0, high: 5.6 },
        female: { low: 4.0, high: 5.6 },
      },
    },
  ];

  const emptyBiomarker: Biomarker = {
    standardCode: '',
    name: '',
    value: 0,
    unit: '',
    referenceMin: undefined,
    referenceMax: undefined,
    flag: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders Biomarkers label', () => {
      render(
        <BiomarkerInput
          biomarkers={[]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );
      expect(screen.getByText('Biomarkers')).toBeInTheDocument();
    });

    it('renders Add Biomarker button', () => {
      render(
        <BiomarkerInput
          biomarkers={[]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );
      expect(screen.getByText('Add Biomarker')).toBeInTheDocument();
    });

    it('shows empty state when no biomarkers', () => {
      render(
        <BiomarkerInput
          biomarkers={[]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );
      expect(screen.getByText(/No biomarkers added yet/)).toBeInTheDocument();
    });

    it('shows loading state when isLoading', () => {
      render(
        <BiomarkerInput
          biomarkers={[]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
          isLoading
        />
      );
      expect(screen.getByText(/Loading biomarker standards/)).toBeInTheDocument();
    });

    it('shows error message when provided', () => {
      render(
        <BiomarkerInput
          biomarkers={[]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
          error="At least one biomarker required"
        />
      );
      expect(screen.getByText('At least one biomarker required')).toBeInTheDocument();
    });

    it('disables add button when loading', () => {
      render(
        <BiomarkerInput
          biomarkers={[]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
          isLoading
        />
      );
      expect(screen.getByText('Add Biomarker').closest('button')).toBeDisabled();
    });
  });

  describe('adding biomarkers', () => {
    it('calls onChange with new empty biomarker when Add clicked', () => {
      render(
        <BiomarkerInput
          biomarkers={[]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );

      fireEvent.click(screen.getByText('Add Biomarker'));

      expect(mockOnChange).toHaveBeenCalledWith([emptyBiomarker]);
    });

    it('appends to existing biomarkers', () => {
      const existingBiomarker: Biomarker = {
        standardCode: 'glucose',
        name: 'Glucose',
        value: 95,
        unit: 'mg/dL',
        referenceMin: 70,
        referenceMax: 100,
        flag: 'normal',
      };

      render(
        <BiomarkerInput
          biomarkers={[existingBiomarker]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );

      fireEvent.click(screen.getByText('Add Biomarker'));

      expect(mockOnChange).toHaveBeenCalledWith([existingBiomarker, emptyBiomarker]);
    });
  });

  describe('removing biomarkers', () => {
    it('removes biomarker when trash button clicked', () => {
      const biomarkers: Biomarker[] = [
        { standardCode: 'glucose', name: 'Glucose', value: 95, unit: 'mg/dL', flag: 'normal' },
        { standardCode: 'hba1c', name: 'HbA1c', value: 5.2, unit: '%', flag: 'normal' },
      ];

      render(
        <BiomarkerInput
          biomarkers={biomarkers}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );

      // Find and click the first remove button
      const removeButtons = screen.getAllByRole('button').filter(btn =>
        btn.className.includes('text-danger')
      );
      fireEvent.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([biomarkers[1]]);
    });
  });

  describe('selecting biomarker standard', () => {
    it('updates biomarker with standard info when selected', () => {
      render(
        <BiomarkerInput
          biomarkers={[emptyBiomarker]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );

      const dropdown = screen.getByTestId('biomarker-dropdown');
      fireEvent.change(dropdown, { target: { value: 'glucose' } });

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          standardCode: 'glucose',
          name: 'Glucose',
          unit: 'mg/dL',
          referenceMin: 70,
          referenceMax: 100,
        }),
      ]);
    });

    it('clears biomarker when selection cleared', () => {
      const biomarker: Biomarker = {
        standardCode: 'glucose',
        name: 'Glucose',
        value: 95,
        unit: 'mg/dL',
        referenceMin: 70,
        referenceMax: 100,
        flag: 'normal',
      };

      render(
        <BiomarkerInput
          biomarkers={[biomarker]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );

      const dropdown = screen.getByTestId('biomarker-dropdown');
      fireEvent.change(dropdown, { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith([emptyBiomarker]);
    });

    it('uses female reference ranges when userGender is female', () => {
      render(
        <BiomarkerInput
          biomarkers={[emptyBiomarker]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
          userGender="female"
        />
      );

      const dropdown = screen.getByTestId('biomarker-dropdown');
      fireEvent.change(dropdown, { target: { value: 'glucose' } });

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          referenceMin: 70,
          referenceMax: 100,
        }),
      ]);
    });
  });

  describe('value changes', () => {
    it('updates value when input changes', () => {
      const biomarker: Biomarker = {
        standardCode: 'glucose',
        name: 'Glucose',
        value: 95,
        unit: 'mg/dL',
        referenceMin: 70,
        referenceMax: 100,
        flag: 'normal',
      };

      render(
        <BiomarkerInput
          biomarkers={[biomarker]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );

      const valueInput = screen.getByTestId('input-value');
      fireEvent.change(valueInput, { target: { value: '110' } });

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          value: 110,
          flag: 'high', // Should recalculate flag
        }),
      ]);
    });

    it('calculates high flag when value exceeds max', () => {
      const biomarker: Biomarker = {
        standardCode: 'glucose',
        name: 'Glucose',
        value: 95,
        unit: 'mg/dL',
        referenceMin: 70,
        referenceMax: 100,
        flag: 'normal',
      };

      render(
        <BiomarkerInput
          biomarkers={[biomarker]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );

      const valueInput = screen.getByTestId('input-value');
      fireEvent.change(valueInput, { target: { value: '150' } });

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({ flag: 'high' }),
      ]);
    });

    it('calculates low flag when value below min', () => {
      const biomarker: Biomarker = {
        standardCode: 'glucose',
        name: 'Glucose',
        value: 95,
        unit: 'mg/dL',
        referenceMin: 70,
        referenceMax: 100,
        flag: 'normal',
      };

      render(
        <BiomarkerInput
          biomarkers={[biomarker]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );

      const valueInput = screen.getByTestId('input-value');
      fireEvent.change(valueInput, { target: { value: '50' } });

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({ flag: 'low' }),
      ]);
    });

    it('disables value input when no standard selected', () => {
      render(
        <BiomarkerInput
          biomarkers={[emptyBiomarker]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );

      const valueInput = screen.getByTestId('input-value');
      expect(valueInput).toBeDisabled();
    });
  });

  describe('flag display', () => {
    it('shows HIGH badge for high values', () => {
      const biomarker: Biomarker = {
        standardCode: 'glucose',
        name: 'Glucose',
        value: 150,
        unit: 'mg/dL',
        referenceMin: 70,
        referenceMax: 100,
        flag: 'high',
      };

      render(
        <BiomarkerInput
          biomarkers={[biomarker]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );

      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('shows LOW badge for low values', () => {
      const biomarker: Biomarker = {
        standardCode: 'glucose',
        name: 'Glucose',
        value: 50,
        unit: 'mg/dL',
        referenceMin: 70,
        referenceMax: 100,
        flag: 'low',
      };

      render(
        <BiomarkerInput
          biomarkers={[biomarker]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );

      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('shows NORMAL badge for normal values', () => {
      const biomarker: Biomarker = {
        standardCode: 'glucose',
        name: 'Glucose',
        value: 85,
        unit: 'mg/dL',
        referenceMin: 70,
        referenceMax: 100,
        flag: 'normal',
      };

      render(
        <BiomarkerInput
          biomarkers={[biomarker]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );

      expect(screen.getByText('normal')).toBeInTheDocument();
    });
  });

  describe('reference range display', () => {
    it('shows reference range when biomarker selected', () => {
      const biomarker: Biomarker = {
        standardCode: 'glucose',
        name: 'Glucose',
        value: 95,
        unit: 'mg/dL',
        referenceMin: 70,
        referenceMax: 100,
        flag: 'normal',
      };

      render(
        <BiomarkerInput
          biomarkers={[biomarker]}
          onChange={mockOnChange}
          availableStandards={mockStandards}
        />
      );

      expect(screen.getByText(/Reference Range/)).toBeInTheDocument();
      expect(screen.getByText(/70 - 100 mg\/dL/)).toBeInTheDocument();
    });
  });
});
