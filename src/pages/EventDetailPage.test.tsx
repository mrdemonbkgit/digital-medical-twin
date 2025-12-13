import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EventDetailPage } from './EventDetailPage';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUpdate = vi.fn();
const mockRemove = vi.fn();
vi.mock('@/hooks', () => ({
  useEvent: vi.fn(() => ({
    event: null,
    isLoading: false,
    error: null,
  })),
  useEventMutation: vi.fn(() => ({
    update: mockUpdate,
    remove: mockRemove,
    isUpdating: false,
    isDeleting: false,
    error: null,
  })),
}));

vi.mock('@/components/layout', () => ({
  PageWrapper: ({ children, title, action }: any) => (
    <div data-testid="page-wrapper" data-title={title}>
      {action}
      {children}
    </div>
  ),
}));

vi.mock('@/components/common', () => ({
  Button: ({ children, onClick, disabled, variant, type, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      type={type}
      className={className}
    >
      {children}
    </button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  LoadingSpinner: ({ size, className }: any) => (
    <div data-testid="loading-spinner" data-size={size} className={className}>
      Loading...
    </div>
  ),
}));

vi.mock('@/components/event', () => ({
  getEventTypeInfo: (type: string) => ({
    label: type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    icon: () => <span data-testid="event-icon">{type}</span>,
    colors: { bg: 'bg-blue-50', icon: 'text-blue-600' },
  }),
  MetricForm: ({ data, onChange, errors }: any) => (
    <div data-testid="metric-form">
      <input
        data-testid="metric-title"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
    </div>
  ),
  DoctorVisitForm: ({ data, onChange, errors }: any) => (
    <div data-testid="doctor-visit-form">
      <input
        data-testid="doctor-title"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
    </div>
  ),
  InterventionForm: ({ data, onChange }: any) => (
    <div data-testid="intervention-form">
      <input
        data-testid="intervention-title"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
    </div>
  ),
  MedicationForm: ({ data, onChange }: any) => (
    <div data-testid="medication-form">
      <input
        data-testid="medication-title"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
    </div>
  ),
  LabResultForm: ({ data, onChange }: any) => (
    <div data-testid="lab-result-form">
      <input
        data-testid="lab-title"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
    </div>
  ),
  ViceForm: ({ data, onChange }: any) => (
    <div data-testid="vice-form">
      <input
        data-testid="vice-title"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
    </div>
  ),
}));

import { useEvent, useEventMutation } from '@/hooks';

describe('EventDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  function renderWithRoute(eventId: string) {
    return render(
      <MemoryRouter initialEntries={[`/event/${eventId}`]}>
        <Routes>
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/timeline" element={<div>Timeline</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  describe('loading state', () => {
    it('shows loading spinner while loading event', () => {
      vi.mocked(useEvent).mockReturnValue({
        event: null,
        isLoading: true,
        error: null,
      });

      renderWithRoute('event-1');

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('page-wrapper')).toHaveAttribute('data-title', 'Loading...');
    });
  });

  describe('error state', () => {
    it('shows error message when event load fails', () => {
      vi.mocked(useEvent).mockReturnValue({
        event: null,
        isLoading: false,
        error: 'Failed to load event',
      });

      renderWithRoute('event-1');

      expect(screen.getByText('Failed to load event')).toBeInTheDocument();
      expect(screen.getByText('Back to Timeline')).toBeInTheDocument();
    });

    it('shows event not found when no event', () => {
      vi.mocked(useEvent).mockReturnValue({
        event: null,
        isLoading: false,
        error: null,
      });

      renderWithRoute('event-1');

      expect(screen.getByText('Event not found')).toBeInTheDocument();
    });
  });

  describe('event display', () => {
    const mockMetricEvent = {
      id: 'event-1',
      userId: 'user-1',
      type: 'metric' as const,
      title: 'Blood Pressure',
      date: '2024-06-15',
      metricName: 'Systolic BP',
      unit: 'mmHg',
      value: 120,
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    };

    beforeEach(() => {
      vi.mocked(useEvent).mockReturnValue({
        event: mockMetricEvent,
        isLoading: false,
        error: null,
      });

      vi.mocked(useEventMutation).mockReturnValue({
        update: mockUpdate,
        remove: mockRemove,
        isUpdating: false,
        isDeleting: false,
        error: null,
        create: vi.fn(),
        isCreating: false,
      });
    });

    it('displays page title with event type', () => {
      renderWithRoute('event-1');

      expect(screen.getByTestId('page-wrapper')).toHaveAttribute('data-title', 'Edit Metric');
    });

    it('shows event type icon and label', () => {
      renderWithRoute('event-1');

      expect(screen.getByTestId('event-icon')).toBeInTheDocument();
      expect(screen.getByText('Metric')).toBeInTheDocument();
    });

    it('renders correct form for event type', () => {
      renderWithRoute('event-1');

      expect(screen.getByTestId('metric-form')).toBeInTheDocument();
    });

    it('shows back to timeline link', () => {
      renderWithRoute('event-1');

      expect(screen.getByText('Back to Timeline')).toBeInTheDocument();
    });

    it('shows save and cancel buttons', () => {
      renderWithRoute('event-1');

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('shows delete button', () => {
      renderWithRoute('event-1');

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    const mockEvent = {
      id: 'event-1',
      userId: 'user-1',
      type: 'metric' as const,
      title: 'Blood Pressure',
      date: '2024-06-15',
      metricName: 'Systolic BP',
      unit: 'mmHg',
      value: 120,
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    };

    beforeEach(() => {
      vi.mocked(useEvent).mockReturnValue({
        event: mockEvent,
        isLoading: false,
        error: null,
      });
    });

    it('calls update on form submission', async () => {
      mockUpdate.mockResolvedValueOnce({});

      renderWithRoute('event-1');

      // Submit the form
      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith('event-1', expect.any(Object));
      });
    });

    it('navigates to timeline after successful update', async () => {
      mockUpdate.mockResolvedValueOnce({});

      renderWithRoute('event-1');

      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/timeline');
      });
    });

    it('shows loading state during update', () => {
      vi.mocked(useEventMutation).mockReturnValue({
        update: mockUpdate,
        remove: mockRemove,
        isUpdating: true,
        isDeleting: false,
        error: null,
        create: vi.fn(),
        isCreating: false,
      });

      renderWithRoute('event-1');

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('shows mutation error', () => {
      vi.mocked(useEventMutation).mockReturnValue({
        update: mockUpdate,
        remove: mockRemove,
        isUpdating: false,
        isDeleting: false,
        error: 'Failed to update event',
        create: vi.fn(),
        isCreating: false,
      });

      renderWithRoute('event-1');

      expect(screen.getByText('Failed to update event')).toBeInTheDocument();
    });
  });

  describe('event deletion', () => {
    const mockEvent = {
      id: 'event-1',
      userId: 'user-1',
      type: 'doctor_visit' as const,
      title: 'Annual Checkup',
      date: '2024-06-15',
      doctorName: 'Dr. Smith',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    };

    beforeEach(() => {
      vi.mocked(useEvent).mockReturnValue({
        event: mockEvent,
        isLoading: false,
        error: null,
      });
    });

    it('shows confirmation dialog before delete', async () => {
      renderWithRoute('event-1');

      fireEvent.click(screen.getByText('Delete'));

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this event?'
      );
    });

    it('calls remove on confirmed delete', async () => {
      mockRemove.mockResolvedValueOnce({});

      renderWithRoute('event-1');

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith('event-1');
      });
    });

    it('does not delete when confirmation cancelled', async () => {
      (window.confirm as jest.Mock).mockReturnValueOnce(false);

      renderWithRoute('event-1');

      fireEvent.click(screen.getByText('Delete'));

      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('navigates to timeline after successful delete', async () => {
      mockRemove.mockResolvedValueOnce({});

      renderWithRoute('event-1');

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/timeline');
      });
    });

    it('shows loading state during delete', () => {
      vi.mocked(useEventMutation).mockReturnValue({
        update: mockUpdate,
        remove: mockRemove,
        isUpdating: false,
        isDeleting: true,
        error: null,
        create: vi.fn(),
        isCreating: false,
      });

      renderWithRoute('event-1');

      // When deleting, the button shows a loading spinner, not "Delete" text
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      // The delete button (with loading spinner) should be disabled
      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(btn => btn.className.includes('danger'));
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('different event types', () => {
    it('renders doctor visit form', () => {
      vi.mocked(useEvent).mockReturnValue({
        event: {
          id: 'event-1',
          userId: 'user-1',
          type: 'doctor_visit' as const,
          title: 'Annual Checkup',
          date: '2024-06-15',
          doctorName: 'Dr. Smith',
          createdAt: '2024-06-15T10:00:00Z',
          updatedAt: '2024-06-15T10:00:00Z',
        },
        isLoading: false,
        error: null,
      });

      renderWithRoute('event-1');

      expect(screen.getByTestId('doctor-visit-form')).toBeInTheDocument();
    });

    it('renders intervention form', () => {
      vi.mocked(useEvent).mockReturnValue({
        event: {
          id: 'event-1',
          userId: 'user-1',
          type: 'intervention' as const,
          title: 'Started Exercise',
          date: '2024-06-15',
          interventionName: 'Daily Walking',
          startDate: '2024-06-15',
          createdAt: '2024-06-15T10:00:00Z',
          updatedAt: '2024-06-15T10:00:00Z',
        },
        isLoading: false,
        error: null,
      });

      renderWithRoute('event-1');

      expect(screen.getByTestId('intervention-form')).toBeInTheDocument();
    });

    it('renders medication form', () => {
      vi.mocked(useEvent).mockReturnValue({
        event: {
          id: 'event-1',
          userId: 'user-1',
          type: 'medication' as const,
          title: 'Started Metformin',
          date: '2024-06-15',
          medicationName: 'Metformin',
          dosage: '500mg',
          frequency: 'twice daily',
          startDate: '2024-06-15',
          status: 'active',
          createdAt: '2024-06-15T10:00:00Z',
          updatedAt: '2024-06-15T10:00:00Z',
        },
        isLoading: false,
        error: null,
      });

      renderWithRoute('event-1');

      expect(screen.getByTestId('medication-form')).toBeInTheDocument();
    });

    it('renders lab result form', () => {
      vi.mocked(useEvent).mockReturnValue({
        event: {
          id: 'event-1',
          userId: 'user-1',
          type: 'lab_result' as const,
          title: 'Blood Test',
          date: '2024-06-15',
          biomarkers: [{ standardCode: 'glucose', name: 'Glucose', value: 95, unit: 'mg/dL' }],
          createdAt: '2024-06-15T10:00:00Z',
          updatedAt: '2024-06-15T10:00:00Z',
        },
        isLoading: false,
        error: null,
      });

      renderWithRoute('event-1');

      expect(screen.getByTestId('lab-result-form')).toBeInTheDocument();
    });

    it('renders vice form', () => {
      vi.mocked(useEvent).mockReturnValue({
        event: {
          id: 'event-1',
          userId: 'user-1',
          type: 'vice' as const,
          title: 'Had a drink',
          date: '2024-06-15',
          viceCategory: 'alcohol',
          createdAt: '2024-06-15T10:00:00Z',
          updatedAt: '2024-06-15T10:00:00Z',
        },
        isLoading: false,
        error: null,
      });

      renderWithRoute('event-1');

      expect(screen.getByTestId('vice-form')).toBeInTheDocument();
    });
  });
});
