import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricForm, createEmptyMetric } from './MetricForm';

// Mock hooks
vi.mock('@/hooks/useUserTags', () => ({
  useUserTags: () => ({ tags: ['morning', 'post-workout', 'fasted'] }),
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

describe('MetricForm', () => {
  const mockOnChange = vi.fn();
  const defaultData = createEmptyMetric();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders title input', () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/^Title/)).toBeInTheDocument();
    });

    it('renders date picker', () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/^Date/)).toBeInTheDocument();
    });

    it('renders source select', () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Source/)).toBeInTheDocument();
    });

    it('renders metric name input', () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Metric Name/)).toBeInTheDocument();
    });

    it('renders value input', () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/^Value/)).toBeInTheDocument();
    });

    it('renders unit input', () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/^Unit/)).toBeInTheDocument();
    });

    it('renders notes textarea', () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Notes/)).toBeInTheDocument();
    });

    it('renders tags input', () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/Tags/)).toBeInTheDocument();
    });
  });

  describe('field changes', () => {
    it('calls onChange when title changes', async () => {
      const user = userEvent.setup();
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-title');
      await user.type(input, 'Morning Heart Rate');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('calls onChange when source changes', async () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);

      const select = screen.getByTestId('select-source');
      fireEvent.change(select, { target: { value: 'whoop' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'whoop' })
      );
    });

    it('calls onChange when metric name changes', async () => {
      const user = userEvent.setup();
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-metric-name');
      await user.type(input, 'HRV');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('calls onChange when value changes', async () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-value');
      fireEvent.change(input, { target: { value: '58' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: 58 })
      );
    });

    it('handles empty value as 0', async () => {
      const dataWithValue = { ...defaultData, value: 50 };
      render(<MetricForm data={dataWithValue} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-value');
      fireEvent.change(input, { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: 0 })
      );
    });

    it('calls onChange when unit changes', async () => {
      const user = userEvent.setup();
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);

      const input = screen.getByTestId('input-unit');
      await user.type(input, 'bpm');

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('source options', () => {
    it('includes manual entry option', () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText('Manual Entry')).toBeInTheDocument();
    });

    it('includes whoop option', () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText('Whoop')).toBeInTheDocument();
    });

    it('includes oura option', () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText('Oura Ring')).toBeInTheDocument();
    });

    it('includes apple health option', () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText('Apple Health')).toBeInTheDocument();
    });

    it('includes garmin option', () => {
      render(<MetricForm data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText('Garmin')).toBeInTheDocument();
    });
  });

  describe('error display', () => {
    it('shows error for title', () => {
      render(
        <MetricForm
          data={defaultData}
          onChange={mockOnChange}
          errors={{ title: 'Required' }}
        />
      );
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('shows error for value', () => {
      render(
        <MetricForm
          data={defaultData}
          onChange={mockOnChange}
          errors={{ value: 'Enter a valid number' }}
        />
      );
      expect(screen.getByText('Enter a valid number')).toBeInTheDocument();
    });

    it('shows error for unit', () => {
      render(
        <MetricForm
          data={defaultData}
          onChange={mockOnChange}
          errors={{ unit: 'Unit required' }}
        />
      );
      expect(screen.getByText('Unit required')).toBeInTheDocument();
    });
  });
});

describe('createEmptyMetric', () => {
  it('returns correct type', () => {
    const empty = createEmptyMetric();
    expect(empty.type).toBe('metric');
  });

  it('sets today as default date', () => {
    const today = new Date().toISOString().split('T')[0];
    const empty = createEmptyMetric();
    expect(empty.date).toBe(today);
  });

  it('sets default source to manual', () => {
    const empty = createEmptyMetric();
    expect(empty.source).toBe('manual');
  });

  it('has empty strings for text fields', () => {
    const empty = createEmptyMetric();
    expect(empty.title).toBe('');
    expect(empty.metricName).toBe('');
    expect(empty.unit).toBe('');
    expect(empty.notes).toBe('');
  });

  it('has 0 as default value', () => {
    const empty = createEmptyMetric();
    expect(empty.value).toBe(0);
  });
});
