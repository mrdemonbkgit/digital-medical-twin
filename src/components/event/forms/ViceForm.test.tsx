import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViceForm, createEmptyVice } from './ViceForm';

// Mock hooks
vi.mock('@/hooks/useUserTags', () => ({
  useUserTags: () => ({ tags: ['weekend', 'relapse', 'recovery'] }),
}));

// Mock components
vi.mock('@/components/common', () => ({
  Input: ({ label, value, onChange, error, required, placeholder, type, step }: any) => (
    <div>
      <label>{label}{required && '*'}</label>
      <input
        type={type || 'text'}
        step={step}
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
        data-testid={`date-${label?.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      />
      {error && <span className="error">{error}</span>}
    </div>
  ),
}));

describe('ViceForm', () => {
  const mockOnChange = vi.fn();
  const defaultData = createEmptyVice();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders privacy notice', () => {
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/private and won't appear/)).toBeInTheDocument();
    });

    it('renders title input', () => {
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/^Title/)).toBeInTheDocument();
    });

    it('renders date picker', () => {
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/^Date/)).toBeInTheDocument();
    });

    it('renders category select', () => {
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Category/)).toBeInTheDocument();
    });

    it('renders amount input', () => {
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Amount/)).toBeInTheDocument();
    });

    it('renders unit select', () => {
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByTestId('select-unit')).toBeInTheDocument();
    });

    it('renders context select', () => {
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Context/)).toBeInTheDocument();
    });

    it('renders trigger input', () => {
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Trigger/)).toBeInTheDocument();
    });

    it('renders notes textarea', () => {
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Notes/)).toBeInTheDocument();
    });

    it('renders tags input', () => {
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Tags/)).toBeInTheDocument();
    });
  });

  describe('field changes', () => {
    it('calls onChange when title changes', async () => {
      const user = userEvent.setup();
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-title');
      await user.type(input, 'Weekend drinks');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('calls onChange when category changes', async () => {
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);

      const select = screen.getByTestId('select-category');
      fireEvent.change(select, { target: { value: 'smoking' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ viceCategory: 'smoking', unit: undefined })
      );
    });

    it('resets unit when category changes', async () => {
      const dataWithUnit = { ...defaultData, unit: 'drinks' };
      render(<ViceForm data={dataWithUnit} onChange={mockOnChange} />);

      const select = screen.getByTestId('select-category');
      fireEvent.change(select, { target: { value: 'smoking' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ unit: undefined })
      );
    });

    it('calls onChange when quantity changes', async () => {
      const user = userEvent.setup();
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-amount--optional-');
      await user.type(input, '3');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('calls onChange when context changes', async () => {
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);

      const select = screen.getByTestId('select-context');
      fireEvent.change(select, { target: { value: 'social' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'social' })
      );
    });

    it('calls onChange when trigger changes', async () => {
      const user = userEvent.setup();
      render(<ViceForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-trigger--optional-');
      await user.type(input, 'party');

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('error display', () => {
    it('shows error for title', () => {
      render(
        <ViceForm
          data={defaultData}
          onChange={mockOnChange}
          errors={{ title: 'Required' }}
        />
      );
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('shows error for category', () => {
      render(
        <ViceForm
          data={defaultData}
          onChange={mockOnChange}
          errors={{ viceCategory: 'Select category' }}
        />
      );
      expect(screen.getByText('Select category')).toBeInTheDocument();
    });
  });
});

describe('createEmptyVice', () => {
  it('returns correct type', () => {
    const empty = createEmptyVice();
    expect(empty.type).toBe('vice');
  });

  it('sets today as default date', () => {
    const today = new Date().toISOString().split('T')[0];
    const empty = createEmptyVice();
    expect(empty.date).toBe(today);
  });

  it('sets default category to alcohol', () => {
    const empty = createEmptyVice();
    expect(empty.viceCategory).toBe('alcohol');
  });

  it('sets isPrivate to true', () => {
    const empty = createEmptyVice();
    expect(empty.isPrivate).toBe(true);
  });

  it('has undefined optional fields', () => {
    const empty = createEmptyVice();
    expect(empty.quantity).toBeUndefined();
    expect(empty.unit).toBeUndefined();
    expect(empty.context).toBeUndefined();
    expect(empty.trigger).toBeUndefined();
  });
});
