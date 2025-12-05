import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from './FilterBar';

// Mock sub-components
vi.mock('./SearchInput', () => ({
  SearchInput: ({ value, onChange }: any) => (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid="search-input"
      placeholder="Search..."
    />
  ),
}));

vi.mock('./EventTypeFilterChips', () => ({
  EventTypeFilterChips: ({ selectedTypes, onToggle, onClear }: any) => (
    <div data-testid="event-type-chips">
      <span data-testid="selected-types">{selectedTypes.join(',')}</span>
      <button onClick={() => onToggle('lab_result')} data-testid="toggle-lab">Toggle Lab</button>
      <button onClick={onClear} data-testid="clear-types">Clear</button>
    </div>
  ),
}));

vi.mock('./DateRangeFilter', () => ({
  DateRangeFilter: ({ startDate, endDate, onChange }: any) => (
    <div data-testid="date-range-filter">
      <input
        type="date"
        value={startDate || ''}
        onChange={(e) => onChange(e.target.value, endDate)}
        data-testid="start-date"
      />
      <input
        type="date"
        value={endDate || ''}
        onChange={(e) => onChange(startDate, e.target.value)}
        data-testid="end-date"
      />
    </div>
  ),
}));

vi.mock('./TagFilter', () => ({
  TagFilter: ({ availableTags, selectedTags, onToggleTag, onClearTags, isLoading }: any) => (
    <div data-testid="tag-filter">
      {isLoading && <span>Loading tags...</span>}
      <span data-testid="available-tags">{availableTags.join(',')}</span>
      <span data-testid="selected-tags">{selectedTags.join(',')}</span>
      <button onClick={() => onToggleTag('urgent')} data-testid="toggle-tag">Toggle Tag</button>
      <button onClick={onClearTags} data-testid="clear-tags">Clear Tags</button>
    </div>
  ),
}));

vi.mock('@/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('FilterBar', () => {
  const defaultProps = {
    search: '',
    onSearchChange: vi.fn(),
    selectedTypes: [],
    onToggleType: vi.fn(),
    onClearTypes: vi.fn(),
    startDate: undefined,
    endDate: undefined,
    onDateChange: vi.fn(),
    availableTags: ['urgent', 'routine', 'follow-up'],
    selectedTags: [],
    onToggleTag: vi.fn(),
    onClearTags: vi.fn(),
    activeFilterCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders search input', () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('renders filters toggle button on mobile', () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('shows filter count badge when filters active', () => {
      render(<FilterBar {...defaultProps} activeFilterCount={3} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders event types section', () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByText('Event Types')).toBeInTheDocument();
      expect(screen.getByTestId('event-type-chips')).toBeInTheDocument();
    });

    it('renders date range section', () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByTestId('date-range-filter')).toBeInTheDocument();
    });

    it('renders tags section', () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByTestId('tag-filter')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<FilterBar {...defaultProps} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('search interactions', () => {
    it('calls onSearchChange when typing in search', async () => {
      const user = userEvent.setup();
      render(<FilterBar {...defaultProps} />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'blood pressure');

      expect(defaultProps.onSearchChange).toHaveBeenCalled();
    });

    it('displays current search value', () => {
      render(<FilterBar {...defaultProps} search="test query" />);
      expect(screen.getByTestId('search-input')).toHaveValue('test query');
    });
  });

  describe('type filter interactions', () => {
    it('calls onToggleType when toggle clicked', async () => {
      const user = userEvent.setup();
      render(<FilterBar {...defaultProps} />);

      await user.click(screen.getByTestId('toggle-lab'));
      expect(defaultProps.onToggleType).toHaveBeenCalledWith('lab_result');
    });

    it('calls onClearTypes when clear clicked', async () => {
      const user = userEvent.setup();
      render(<FilterBar {...defaultProps} />);

      await user.click(screen.getByTestId('clear-types'));
      expect(defaultProps.onClearTypes).toHaveBeenCalled();
    });

    it('passes selected types to child component', () => {
      render(<FilterBar {...defaultProps} selectedTypes={['lab_result', 'medication']} />);
      expect(screen.getByTestId('selected-types')).toHaveTextContent('lab_result,medication');
    });
  });

  describe('date filter interactions', () => {
    it('calls onDateChange when start date changes', async () => {
      const user = userEvent.setup();
      render(<FilterBar {...defaultProps} />);

      const startDate = screen.getByTestId('start-date');
      await user.type(startDate, '2024-01-01');

      expect(defaultProps.onDateChange).toHaveBeenCalled();
    });

    it('calls onDateChange when end date changes', async () => {
      const user = userEvent.setup();
      render(<FilterBar {...defaultProps} />);

      const endDate = screen.getByTestId('end-date');
      await user.type(endDate, '2024-12-31');

      expect(defaultProps.onDateChange).toHaveBeenCalled();
    });

    it('passes date values to child component', () => {
      render(<FilterBar {...defaultProps} startDate="2024-01-01" endDate="2024-12-31" />);
      expect(screen.getByTestId('start-date')).toHaveValue('2024-01-01');
      expect(screen.getByTestId('end-date')).toHaveValue('2024-12-31');
    });
  });

  describe('tag filter interactions', () => {
    it('calls onToggleTag when tag toggle clicked', async () => {
      const user = userEvent.setup();
      render(<FilterBar {...defaultProps} />);

      await user.click(screen.getByTestId('toggle-tag'));
      expect(defaultProps.onToggleTag).toHaveBeenCalledWith('urgent');
    });

    it('calls onClearTags when clear clicked', async () => {
      const user = userEvent.setup();
      render(<FilterBar {...defaultProps} />);

      await user.click(screen.getByTestId('clear-tags'));
      expect(defaultProps.onClearTags).toHaveBeenCalled();
    });

    it('passes available tags to child component', () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByTestId('available-tags')).toHaveTextContent('urgent,routine,follow-up');
    });

    it('passes selected tags to child component', () => {
      render(<FilterBar {...defaultProps} selectedTags={['urgent', 'routine']} />);
      expect(screen.getByTestId('selected-tags')).toHaveTextContent('urgent,routine');
    });

    it('shows loading state when tags loading', () => {
      render(<FilterBar {...defaultProps} isLoadingTags />);
      expect(screen.getByText('Loading tags...')).toBeInTheDocument();
    });
  });

  describe('mobile toggle', () => {
    it('toggles filter visibility on mobile', async () => {
      const user = userEvent.setup();
      render(<FilterBar {...defaultProps} />);

      const toggleButton = screen.getByText('Filters');

      // Click to expand
      await user.click(toggleButton);

      // Click to collapse
      await user.click(toggleButton);

      // Filters should still be in DOM (just hidden on mobile via CSS)
      expect(screen.getByTestId('event-type-chips')).toBeInTheDocument();
    });
  });
});
