import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BiomarkerSelect } from './BiomarkerSelect';
import type { BiomarkerStandard } from '@/types';

const mockBiomarkers: BiomarkerStandard[] = [
  {
    code: 'GLU',
    name: 'Glucose',
    category: 'metabolic',
    standardUnit: 'mg/dL',
    aliases: ['Blood Sugar', 'FBG'],
    description: 'Blood glucose level',
  },
  {
    code: 'HBA1C',
    name: 'Hemoglobin A1c',
    category: 'metabolic',
    standardUnit: '%',
    aliases: ['A1c', 'Glycated Hemoglobin'],
    description: 'Average blood sugar over 3 months',
  },
  {
    code: 'CHOL',
    name: 'Total Cholesterol',
    category: 'lipid_panel',
    standardUnit: 'mg/dL',
    aliases: ['TC'],
    description: 'Total cholesterol level',
  },
  {
    code: 'LDL',
    name: 'LDL Cholesterol',
    category: 'lipid_panel',
    standardUnit: 'mg/dL',
    aliases: ['Bad Cholesterol'],
    description: 'Low-density lipoprotein',
  },
  {
    code: 'HDL',
    name: 'HDL Cholesterol',
    category: 'lipid_panel',
    standardUnit: 'mg/dL',
    aliases: ['Good Cholesterol'],
    description: 'High-density lipoprotein',
  },
  {
    code: 'TSH',
    name: 'Thyroid Stimulating Hormone',
    category: 'thyroid',
    standardUnit: 'mIU/L',
    aliases: ['Thyrotropin'],
    description: 'Thyroid function marker',
  },
];

describe('BiomarkerSelect', () => {
  const mockOnChange = vi.fn();

  const defaultProps = {
    biomarkers: mockBiomarkers,
    value: null,
    onChange: mockOnChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders biomarker label', () => {
      render(<BiomarkerSelect {...defaultProps} />);
      expect(screen.getByText('Biomarker')).toBeInTheDocument();
    });

    it('shows placeholder when no value selected', () => {
      render(<BiomarkerSelect {...defaultProps} />);
      expect(screen.getByText('Select biomarker...')).toBeInTheDocument();
    });

    it('shows selected biomarker name', () => {
      render(<BiomarkerSelect {...defaultProps} value="GLU" />);
      expect(screen.getByText('Glucose')).toBeInTheDocument();
    });

    it('shows selected biomarker code', () => {
      render(<BiomarkerSelect {...defaultProps} value="GLU" />);
      expect(screen.getByText('GLU')).toBeInTheDocument();
    });

    it('shows clear button when value is selected', () => {
      const { container } = render(<BiomarkerSelect {...defaultProps} value="GLU" />);
      // X icon for clearing
      const clearIcon = container.querySelector('.lucide-x');
      expect(clearIcon).toBeInTheDocument();
    });

    it('does not show clear button when no value', () => {
      const { container } = render(<BiomarkerSelect {...defaultProps} />);
      const clearIcon = container.querySelector('.lucide-x');
      expect(clearIcon).not.toBeInTheDocument();
    });
  });

  describe('dropdown behavior', () => {
    it('opens dropdown when button is clicked', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByPlaceholderText('Search biomarkers...')).toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <BiomarkerSelect {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      await user.click(screen.getByRole('button'));
      expect(screen.getByPlaceholderText('Search biomarkers...')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search biomarkers...')).not.toBeInTheDocument();
      });
    });

    it('shows biomarkers grouped by category', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Metabolic Panel')).toBeInTheDocument();
      expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
      expect(screen.getByText('Thyroid Panel')).toBeInTheDocument();
    });

    it('shows all biomarkers in dropdown', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Glucose')).toBeInTheDocument();
      expect(screen.getByText('Hemoglobin A1c')).toBeInTheDocument();
      expect(screen.getByText('Total Cholesterol')).toBeInTheDocument();
      expect(screen.getByText('LDL Cholesterol')).toBeInTheDocument();
    });

    it('shows biomarker units in dropdown', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      // Multiple biomarkers share mg/dL unit
      expect(screen.getAllByText('mg/dL').length).toBeGreaterThan(0);
      expect(screen.getByText('%')).toBeInTheDocument();
      expect(screen.getByText('mIU/L')).toBeInTheDocument();
    });

    it('shows first alias in dropdown', async () => {
      const user = userEvent.setup();
      const { container } = render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      // Aliases are shown in parentheses with ml-2 class (unit spans have font-mono)
      const aliasElements = container.querySelectorAll('.ml-2.text-xs.text-gray-400');
      const aliasTexts = Array.from(aliasElements).map((el) => el.textContent);
      // Verify aliases are rendered for biomarkers that have them
      expect(aliasTexts.length).toBeGreaterThan(0);
      // Check for specific alias patterns (parentheses around text)
      expect(aliasTexts.some((text) => text?.startsWith('(') && text?.endsWith(')'))).toBe(true);
    });

    it('rotates chevron when dropdown opens', async () => {
      const user = userEvent.setup();
      const { container } = render(<BiomarkerSelect {...defaultProps} />);

      const chevron = container.querySelector('.lucide-chevron-down');
      expect(chevron).not.toHaveClass('rotate-180');

      await user.click(screen.getByRole('button'));

      expect(chevron).toHaveClass('rotate-180');
    });
  });

  describe('search functionality', () => {
    it('focuses search input when dropdown opens', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      const searchInput = screen.getByPlaceholderText('Search biomarkers...');
      await waitFor(() => {
        expect(searchInput).toHaveFocus();
      });
    });

    it('filters biomarkers by name', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.type(screen.getByPlaceholderText('Search biomarkers...'), 'Cholesterol');

      expect(screen.getByText('Total Cholesterol')).toBeInTheDocument();
      expect(screen.getByText('LDL Cholesterol')).toBeInTheDocument();
      expect(screen.getByText('HDL Cholesterol')).toBeInTheDocument();
      expect(screen.queryByText('Glucose')).not.toBeInTheDocument();
    });

    it('filters biomarkers by code', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.type(screen.getByPlaceholderText('Search biomarkers...'), 'TSH');

      expect(screen.getByText('Thyroid Stimulating Hormone')).toBeInTheDocument();
      expect(screen.queryByText('Glucose')).not.toBeInTheDocument();
    });

    it('filters biomarkers by alias', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.type(screen.getByPlaceholderText('Search biomarkers...'), 'Blood Sugar');

      expect(screen.getByText('Glucose')).toBeInTheDocument();
      expect(screen.queryByText('Total Cholesterol')).not.toBeInTheDocument();
    });

    it('shows no results message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.type(screen.getByPlaceholderText('Search biomarkers...'), 'xyz123');

      expect(screen.getByText('No biomarkers found')).toBeInTheDocument();
    });

    it('search is case insensitive', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.type(screen.getByPlaceholderText('Search biomarkers...'), 'GLUCOSE');

      expect(screen.getByText('Glucose')).toBeInTheDocument();
    });

    it('clears search when dropdown closes', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <BiomarkerSelect {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      await user.click(screen.getByRole('button'));
      await user.type(screen.getByPlaceholderText('Search biomarkers...'), 'test');

      fireEvent.mouseDown(screen.getByTestId('outside'));

      await user.click(screen.getByRole('button'));
      expect(screen.getByPlaceholderText('Search biomarkers...')).toHaveValue('');
    });
  });

  describe('selection', () => {
    it('calls onChange with selected biomarker', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      // Find and click the Glucose option (not the category header)
      const glucoseOptions = screen.getAllByText('Glucose');
      const glucoseButton = glucoseOptions.find((el) =>
        el.closest('button[type="button"]')
      );
      await user.click(glucoseButton!);

      expect(mockOnChange).toHaveBeenCalledWith(mockBiomarkers[0]);
    });

    it('closes dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      const glucoseOptions = screen.getAllByText('Glucose');
      const glucoseButton = glucoseOptions.find((el) =>
        el.closest('button[type="button"]')
      );
      await user.click(glucoseButton!);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search biomarkers...')).not.toBeInTheDocument();
      });
    });

    it('highlights currently selected biomarker', async () => {
      const user = userEvent.setup();
      const { container } = render(<BiomarkerSelect {...defaultProps} value="GLU" />);

      await user.click(screen.getByRole('button'));

      // The selected option in the dropdown should have bg-blue-50 class
      // Find the option button inside the dropdown's scrollable area
      const dropdown = container.querySelector('.overflow-y-auto');
      const optionButtons = dropdown?.querySelectorAll('button[type="button"]');
      const glucoseButton = Array.from(optionButtons || []).find((btn) =>
        btn.textContent?.includes('Glucose')
      );

      expect(glucoseButton).toHaveClass('bg-blue-50');
    });

    it('clears selection when clear button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<BiomarkerSelect {...defaultProps} value="GLU" />);

      const clearIcon = container.querySelector('.lucide-x');
      await user.click(clearIcon!);

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });
  });

  describe('exclusions', () => {
    it('excludes biomarkers in excludeCodes', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} excludeCodes={['GLU', 'CHOL']} />);

      await user.click(screen.getByRole('button'));

      expect(screen.queryByText('Glucose')).not.toBeInTheDocument();
      expect(screen.queryByText('Total Cholesterol')).not.toBeInTheDocument();
      expect(screen.getByText('Hemoglobin A1c')).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables button when disabled', () => {
      render(<BiomarkerSelect {...defaultProps} disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<BiomarkerSelect {...defaultProps} disabled />);
      expect(screen.getByRole('button')).toHaveClass('bg-gray-50');
      expect(screen.getByRole('button')).toHaveClass('cursor-not-allowed');
    });

    it('does not show clear button when disabled', () => {
      const { container } = render(
        <BiomarkerSelect {...defaultProps} value="GLU" disabled />
      );
      const clearIcon = container.querySelector('.lucide-x');
      expect(clearIcon).not.toBeInTheDocument();
    });

    it('does not open dropdown when disabled', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} disabled />);

      await user.click(screen.getByRole('button'));

      expect(screen.queryByPlaceholderText('Search biomarkers...')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message', () => {
      render(<BiomarkerSelect {...defaultProps} error="Biomarker is required" />);
      expect(screen.getByText('Biomarker is required')).toBeInTheDocument();
    });

    it('applies error styling to button', () => {
      render(<BiomarkerSelect {...defaultProps} error="Error" />);
      expect(screen.getByRole('button')).toHaveClass('border-red-500');
    });
  });

  describe('accessibility', () => {
    it('button has type="button"', () => {
      render(<BiomarkerSelect {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('search input is focusable', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      const searchInput = screen.getByPlaceholderText('Search biomarkers...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('option buttons have type="button"', async () => {
      const user = userEvent.setup();
      render(<BiomarkerSelect {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      const optionButtons = screen.getAllByRole('button').filter(
        (btn) => btn.getAttribute('type') === 'button'
      );
      expect(optionButtons.length).toBeGreaterThan(1);
    });
  });
});
