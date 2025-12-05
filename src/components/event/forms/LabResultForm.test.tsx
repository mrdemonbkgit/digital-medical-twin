import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LabResultForm, createEmptyLabResult } from './LabResultForm';

// Mock hooks
vi.mock('@/hooks/useUserTags', () => ({
  useUserTags: () => ({ tags: ['routine', 'fasting', 'follow-up'] }),
}));

vi.mock('@/hooks', () => ({
  useBiomarkers: () => ({ biomarkers: [], isLoading: false }),
  useUserTags: () => ({ tags: ['routine', 'fasting'] }),
  useUserProfile: () => ({ profile: { gender: 'male' } }),
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
        data-testid={`input-${label?.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      />
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
        data-testid={`textarea-${label?.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      />
    </div>
  ),
  TagInput: ({ label, tags, onChange }: any) => (
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
        data-testid={`date-${label?.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      />
      {error && <span className="error">{error}</span>}
    </div>
  ),
}));

vi.mock('../BiomarkerInput', () => ({
  BiomarkerInput: ({ biomarkers, onChange, error }: any) => (
    <div data-testid="biomarker-input">
      <span>Biomarkers: {biomarkers?.length || 0}</span>
      {error && <span className="error">{error}</span>}
    </div>
  ),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('LabResultForm', () => {
  const mockOnChange = vi.fn();
  const defaultData = createEmptyLabResult();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders PDF upload helper link', () => {
      renderWithRouter(<LabResultForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Have a lab result PDF/)).toBeInTheDocument();
    });

    it('renders title input', () => {
      renderWithRouter(<LabResultForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/^Title/)).toBeInTheDocument();
    });

    it('renders date picker', () => {
      renderWithRouter(<LabResultForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/^Date/)).toBeInTheDocument();
    });

    it('renders lab name input', () => {
      renderWithRouter(<LabResultForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Lab Name/)).toBeInTheDocument();
    });

    it('renders ordering doctor input', () => {
      renderWithRouter(<LabResultForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Ordering Doctor/)).toBeInTheDocument();
    });

    it('renders biomarker input component', () => {
      renderWithRouter(<LabResultForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByTestId('biomarker-input')).toBeInTheDocument();
    });

    it('renders notes textarea', () => {
      renderWithRouter(<LabResultForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Notes/)).toBeInTheDocument();
    });

    it('renders tags input', () => {
      renderWithRouter(<LabResultForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Tags/)).toBeInTheDocument();
    });
  });

  describe('field changes', () => {
    it('calls onChange when title changes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LabResultForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-title');
      await user.type(input, 'Lipid Panel');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('calls onChange when date changes', async () => {
      renderWithRouter(<LabResultForm data={defaultData} onChange={mockOnChange} />);

      const dateInput = screen.getByTestId('date-date');
      fireEvent.change(dateInput, { target: { value: '2024-03-15' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ date: '2024-03-15' })
      );
    });

    it('calls onChange when lab name changes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LabResultForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-lab-name--optional-');
      await user.type(input, 'Quest');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('clears optional field when emptied', async () => {
      const dataWithLabName = { ...defaultData, labName: 'Quest' };
      renderWithRouter(<LabResultForm data={dataWithLabName} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-lab-name--optional-');
      fireEvent.change(input, { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ labName: undefined })
      );
    });
  });

  describe('error display', () => {
    it('shows error for title', () => {
      renderWithRouter(
        <LabResultForm
          data={defaultData}
          onChange={mockOnChange}
          errors={{ title: 'Required' }}
        />
      );
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('shows error for biomarkers', () => {
      renderWithRouter(
        <LabResultForm
          data={defaultData}
          onChange={mockOnChange}
          errors={{ biomarkers: 'Add at least one biomarker' }}
        />
      );
      expect(screen.getByText('Add at least one biomarker')).toBeInTheDocument();
    });
  });
});

describe('createEmptyLabResult', () => {
  it('returns correct type', () => {
    const empty = createEmptyLabResult();
    expect(empty.type).toBe('lab_result');
  });

  it('sets today as default date', () => {
    const today = new Date().toISOString().split('T')[0];
    const empty = createEmptyLabResult();
    expect(empty.date).toBe(today);
  });

  it('has empty biomarkers array', () => {
    const empty = createEmptyLabResult();
    expect(empty.biomarkers).toEqual([]);
  });

  it('has undefined optional fields', () => {
    const empty = createEmptyLabResult();
    expect(empty.labName).toBeUndefined();
    expect(empty.orderingDoctor).toBeUndefined();
    expect(empty.attachments).toBeUndefined();
  });

  it('has empty string for title and notes', () => {
    const empty = createEmptyLabResult();
    expect(empty.title).toBe('');
    expect(empty.notes).toBe('');
  });
});
