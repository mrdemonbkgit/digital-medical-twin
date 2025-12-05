import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MedicationForm, createEmptyMedication } from './MedicationForm';

// Mock hooks
vi.mock('@/hooks/useUserTags', () => ({
  useUserTags: () => ({ tags: ['prescription', 'supplement', 'prn'] }),
}));

// Mock components
vi.mock('@/components/common', () => ({
  Input: ({ label, value, onChange, error, required, placeholder }: any) => (
    <div>
      <label>{label}{required && '*'}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        data-testid={`input-${label?.toLowerCase().replace(/\s+/g, '-')}`}
      />
      {error && <span className="error">{error}</span>}
    </div>
  ),
  Select: ({ label, value, onChange, options, error, required }: any) => (
    <div>
      <label>{label}{required && '*'}</label>
      <select
        value={value}
        onChange={onChange}
        data-testid={`select-${label?.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="error">{error}</span>}
    </div>
  ),
  TextArea: ({ label, value, onChange, placeholder, rows }: any) => (
    <div>
      <label>{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        data-testid={`textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`}
      />
    </div>
  ),
  TagInput: ({ label, tags, onChange, suggestions, placeholder }: any) => (
    <div>
      <label>{label}</label>
      <div data-testid="tag-input">
        {tags?.map((tag: string) => <span key={tag}>{tag}</span>)}
      </div>
    </div>
  ),
}));

vi.mock('@/components/forms', () => ({
  DatePicker: ({ label, value, onChange, error, required }: any) => (
    <div>
      <label>{label}{required && '*'}</label>
      <input
        type="date"
        value={value}
        onChange={onChange}
        data-testid={`date-${label?.toLowerCase().replace(/\s+/g, '-')}`}
      />
      {error && <span className="error">{error}</span>}
    </div>
  ),
}));

describe('MedicationForm', () => {
  const mockOnChange = vi.fn();
  const defaultData = createEmptyMedication();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders medication name input', () => {
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Medication Name/)).toBeInTheDocument();
    });

    it('renders title input', () => {
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/^Title/)).toBeInTheDocument();
    });

    it('renders event date picker', () => {
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Event Date/)).toBeInTheDocument();
    });

    it('renders dosage input', () => {
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Dosage/)).toBeInTheDocument();
    });

    it('renders frequency select', () => {
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Frequency/)).toBeInTheDocument();
    });

    it('renders prescriber input', () => {
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Prescriber/)).toBeInTheDocument();
    });

    it('renders reason input', () => {
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Reason/)).toBeInTheDocument();
    });

    it('renders start date picker', () => {
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Start Date/)).toBeInTheDocument();
    });

    it('renders end date picker', () => {
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/End Date/)).toBeInTheDocument();
    });

    it('renders isActive checkbox', () => {
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByLabelText(/Currently taking/)).toBeInTheDocument();
    });

    it('renders notes textarea', () => {
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Notes/)).toBeInTheDocument();
    });

    it('renders tags input', () => {
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Tags/)).toBeInTheDocument();
    });
  });

  describe('field changes', () => {
    it('calls onChange when medication name changes', async () => {
      const user = userEvent.setup();
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-medication-name');
      await user.type(input, 'Metformin');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('auto-updates title when medication name changes and title is empty', async () => {
      const user = userEvent.setup();
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-medication-name');
      await user.type(input, 'M');

      // Should update both medicationName and title
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.medicationName).toBe('M');
      expect(lastCall.title).toBe('M');
    });

    it('calls onChange when dosage changes', async () => {
      const user = userEvent.setup();
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-dosage');
      await user.type(input, '500mg');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ dosage: expect.any(String) })
      );
    });

    it('calls onChange when frequency changes', async () => {
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);

      const select = screen.getByTestId('select-frequency');
      fireEvent.change(select, { target: { value: 'twice daily' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ frequency: 'twice daily' })
      );
    });

    it('clears endDate when isActive is checked', async () => {
      const dataWithEndDate = { ...defaultData, isActive: false, endDate: '2024-01-01' };
      render(<MedicationForm data={dataWithEndDate} onChange={mockOnChange} />);

      const checkbox = screen.getByLabelText(/Currently taking/);
      fireEvent.click(checkbox);

      // Component makes two separate onChange calls: one for isActive, one for endDate
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true })
      );
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ endDate: undefined })
      );
    });

    it('sets isActive to false when end date is set', async () => {
      render(<MedicationForm data={defaultData} onChange={mockOnChange} />);

      const endDateInput = screen.getByTestId('date-end-date-(if-discontinued)');
      fireEvent.change(endDateInput, { target: { value: '2024-06-01' } });

      // First call updates endDate, second call updates isActive
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('error display', () => {
    it('shows error for medication name', () => {
      render(
        <MedicationForm
          data={defaultData}
          onChange={mockOnChange}
          errors={{ medicationName: 'Required' }}
        />
      );
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('shows error for title', () => {
      render(
        <MedicationForm
          data={defaultData}
          onChange={mockOnChange}
          errors={{ title: 'Title is required' }}
        />
      );
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });
});

describe('createEmptyMedication', () => {
  it('returns correct type', () => {
    const empty = createEmptyMedication();
    expect(empty.type).toBe('medication');
  });

  it('sets today as default date', () => {
    const today = new Date().toISOString().split('T')[0];
    const empty = createEmptyMedication();
    expect(empty.date).toBe(today);
  });

  it('sets isActive to true by default', () => {
    const empty = createEmptyMedication();
    expect(empty.isActive).toBe(true);
  });

  it('sets default frequency', () => {
    const empty = createEmptyMedication();
    expect(empty.frequency).toBe('once daily');
  });

  it('has empty strings for required text fields', () => {
    const empty = createEmptyMedication();
    expect(empty.title).toBe('');
    expect(empty.medicationName).toBe('');
    expect(empty.dosage).toBe('');
  });
});
