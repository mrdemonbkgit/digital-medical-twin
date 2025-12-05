import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InterventionForm, createEmptyIntervention } from './InterventionForm';

// Mock hooks
vi.mock('@/hooks/useUserTags', () => ({
  useUserTags: () => ({ tags: ['experiment', 'n=1', 'lifestyle'] }),
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
  Select: ({ label, value, onChange, options, error, required }: any) => (
    <div>
      <label>{label}{required && '*'}</label>
      <select
        value={value}
        onChange={onChange}
        data-testid={`select-${label?.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
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

describe('InterventionForm', () => {
  const mockOnChange = vi.fn();
  const defaultData = createEmptyIntervention();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders title input', () => {
      render(<InterventionForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/^Title/)).toBeInTheDocument();
    });

    it('renders intervention name input', () => {
      render(<InterventionForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Intervention Name/)).toBeInTheDocument();
    });

    it('renders category select', () => {
      render(<InterventionForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Category/)).toBeInTheDocument();
    });

    it('renders event date picker', () => {
      render(<InterventionForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Event Date/)).toBeInTheDocument();
    });

    it('renders start date picker', () => {
      render(<InterventionForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Start Date/)).toBeInTheDocument();
    });

    it('renders end date picker', () => {
      render(<InterventionForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/End Date/)).toBeInTheDocument();
    });

    it('renders isOngoing checkbox', () => {
      render(<InterventionForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByLabelText(/Currently ongoing/)).toBeInTheDocument();
    });

    it('renders protocol textarea', () => {
      render(<InterventionForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Protocol/)).toBeInTheDocument();
    });

    it('renders notes textarea', () => {
      render(<InterventionForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/^Notes/)).toBeInTheDocument();
    });

    it('renders tags input', () => {
      render(<InterventionForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Tags/)).toBeInTheDocument();
    });
  });

  describe('field changes', () => {
    it('calls onChange when title changes', async () => {
      const user = userEvent.setup();
      render(<InterventionForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-title');
      await user.type(input, 'Started Keto');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('calls onChange when category changes', async () => {
      render(<InterventionForm data={defaultData} onChange={mockOnChange} />);

      const select = screen.getByTestId('select-category');
      fireEvent.change(select, { target: { value: 'diet' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'diet' })
      );
    });

    it('clears endDate when isOngoing is checked', async () => {
      const dataWithEndDate = { ...defaultData, isOngoing: false, endDate: '2024-01-01' };
      render(<InterventionForm data={dataWithEndDate} onChange={mockOnChange} />);

      const checkbox = screen.getByLabelText(/Currently ongoing/);
      fireEvent.click(checkbox);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ isOngoing: true, endDate: undefined })
      );
    });

    it('updates isOngoing to false when endDate is set', async () => {
      render(<InterventionForm data={defaultData} onChange={mockOnChange} />);

      const endDateInput = screen.getByTestId('date-end-date--leave-empty-if-ongoing-');
      fireEvent.change(endDateInput, { target: { value: '2024-06-01' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ endDate: '2024-06-01', isOngoing: false })
      );
    });

    it('calls onChange when protocol changes', async () => {
      const user = userEvent.setup();
      render(<InterventionForm data={defaultData} onChange={mockOnChange} />);

      const textarea = screen.getByTestId('textarea-protocol--optional-');
      await user.type(textarea, 'Daily routine');

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('error display', () => {
    it('shows error for title', () => {
      render(
        <InterventionForm
          data={defaultData}
          onChange={mockOnChange}
          errors={{ title: 'Required' }}
        />
      );
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('shows error for intervention name', () => {
      render(
        <InterventionForm
          data={defaultData}
          onChange={mockOnChange}
          errors={{ interventionName: 'Name required' }}
        />
      );
      expect(screen.getByText('Name required')).toBeInTheDocument();
    });
  });
});

describe('createEmptyIntervention', () => {
  it('returns correct type', () => {
    const empty = createEmptyIntervention();
    expect(empty.type).toBe('intervention');
  });

  it('sets today as default date', () => {
    const today = new Date().toISOString().split('T')[0];
    const empty = createEmptyIntervention();
    expect(empty.date).toBe(today);
  });

  it('sets isOngoing to true by default', () => {
    const empty = createEmptyIntervention();
    expect(empty.isOngoing).toBe(true);
  });

  it('sets default category to other', () => {
    const empty = createEmptyIntervention();
    expect(empty.category).toBe('other');
  });

  it('has empty strings for required text fields', () => {
    const empty = createEmptyIntervention();
    expect(empty.title).toBe('');
    expect(empty.interventionName).toBe('');
  });

  it('has undefined optional fields', () => {
    const empty = createEmptyIntervention();
    expect(empty.endDate).toBeUndefined();
    expect(empty.protocol).toBeUndefined();
  });
});
