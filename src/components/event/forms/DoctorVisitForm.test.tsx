import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DoctorVisitForm, createEmptyDoctorVisit } from './DoctorVisitForm';

// Mock hooks
vi.mock('@/hooks/useUserTags', () => ({
  useUserTags: () => ({ tags: ['annual', 'specialist', 'urgent'] }),
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

describe('DoctorVisitForm', () => {
  const mockOnChange = vi.fn();
  const defaultData = createEmptyDoctorVisit();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders title input', () => {
      render(<DoctorVisitForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/^Title/)).toBeInTheDocument();
    });

    it('renders date picker', () => {
      render(<DoctorVisitForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/^Date/)).toBeInTheDocument();
    });

    it('renders doctor name input', () => {
      render(<DoctorVisitForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Doctor Name/)).toBeInTheDocument();
    });

    it('renders specialty input', () => {
      render(<DoctorVisitForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Specialty/)).toBeInTheDocument();
    });

    it('renders facility input', () => {
      render(<DoctorVisitForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Facility/)).toBeInTheDocument();
    });

    it('renders diagnosis input', () => {
      render(<DoctorVisitForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Diagnosis/)).toBeInTheDocument();
    });

    it('renders follow-up input', () => {
      render(<DoctorVisitForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Follow-up/)).toBeInTheDocument();
    });

    it('renders notes textarea', () => {
      render(<DoctorVisitForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Notes/)).toBeInTheDocument();
    });

    it('renders tags input', () => {
      render(<DoctorVisitForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Tags/)).toBeInTheDocument();
    });
  });

  describe('field changes', () => {
    it('calls onChange when title changes', async () => {
      const user = userEvent.setup();
      render(<DoctorVisitForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-title');
      await user.type(input, 'Annual Physical');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('calls onChange when doctor name changes', async () => {
      const user = userEvent.setup();
      render(<DoctorVisitForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-doctor-name');
      await user.type(input, 'Dr. Smith');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('parses comma-separated diagnosis', async () => {
      render(<DoctorVisitForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-diagnosis--optional-');
      fireEvent.change(input, { target: { value: 'Type 2 Diabetes, Hypertension' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ diagnosis: ['Type 2 Diabetes', 'Hypertension'] })
      );
    });

    it('clears diagnosis when empty', async () => {
      const dataWithDiagnosis = { ...defaultData, diagnosis: ['Diabetes'] };
      render(<DoctorVisitForm data={dataWithDiagnosis} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-diagnosis--optional-');
      fireEvent.change(input, { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ diagnosis: undefined })
      );
    });

    it('trims whitespace from diagnosis entries', async () => {
      render(<DoctorVisitForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-diagnosis--optional-');
      fireEvent.change(input, { target: { value: '  Diabetes  ,  Hypertension  ' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ diagnosis: ['Diabetes', 'Hypertension'] })
      );
    });

    it('calls onChange when follow-up changes', async () => {
      const user = userEvent.setup();
      render(<DoctorVisitForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-follow-up--optional-');
      await user.type(input, 'Return in 3 months');

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('error display', () => {
    it('shows error for title', () => {
      render(
        <DoctorVisitForm
          data={defaultData}
          onChange={mockOnChange}
          errors={{ title: 'Required' }}
        />
      );
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('shows error for doctor name', () => {
      render(
        <DoctorVisitForm
          data={defaultData}
          onChange={mockOnChange}
          errors={{ doctorName: 'Doctor name required' }}
        />
      );
      expect(screen.getByText('Doctor name required')).toBeInTheDocument();
    });
  });
});

describe('createEmptyDoctorVisit', () => {
  it('returns correct type', () => {
    const empty = createEmptyDoctorVisit();
    expect(empty.type).toBe('doctor_visit');
  });

  it('sets today as default date', () => {
    const today = new Date().toISOString().split('T')[0];
    const empty = createEmptyDoctorVisit();
    expect(empty.date).toBe(today);
  });

  it('has empty strings for required text fields', () => {
    const empty = createEmptyDoctorVisit();
    expect(empty.title).toBe('');
    expect(empty.doctorName).toBe('');
    expect(empty.notes).toBe('');
  });

  it('has undefined optional fields', () => {
    const empty = createEmptyDoctorVisit();
    expect(empty.specialty).toBeUndefined();
    expect(empty.facility).toBeUndefined();
    expect(empty.diagnosis).toBeUndefined();
    expect(empty.followUp).toBeUndefined();
  });
});
