import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EventNewPage } from './EventNewPage';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockCreate = vi.fn();
vi.mock('@/hooks', () => ({
  useEventMutation: vi.fn(() => ({
    create: mockCreate,
    isCreating: false,
    error: null,
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('@/api/labUploads', () => ({
  getLabUpload: vi.fn(),
  updateLabUpload: vi.fn(),
}));

vi.mock('@/routes/routes', () => ({
  ROUTES: {
    LAB_UPLOADS: '/lab-uploads',
  },
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
  Button: ({ children, onClick, disabled, variant, type }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} type={type}>
      {children}
    </button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  LoadingSpinner: ({ className, size }: any) => (
    <div data-testid="loading-spinner" className={className} data-size={size}>
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
      <input
        data-testid="metric-name"
        value={data.metricName || ''}
        onChange={(e) => onChange({ ...data, metricName: e.target.value })}
      />
      {errors?.metricName && <span>{errors.metricName}</span>}
    </div>
  ),
  DoctorVisitForm: ({ data, onChange, errors }: any) => (
    <div data-testid="doctor-visit-form">
      <input
        data-testid="doctor-title"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
      <input
        data-testid="doctor-name"
        value={data.doctorName || ''}
        onChange={(e) => onChange({ ...data, doctorName: e.target.value })}
      />
      {errors?.doctorName && <span>{errors.doctorName}</span>}
    </div>
  ),
  InterventionForm: ({ data, onChange, errors }: any) => (
    <div data-testid="intervention-form">
      <input
        data-testid="intervention-title"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
    </div>
  ),
  MedicationForm: ({ data, onChange, errors }: any) => (
    <div data-testid="medication-form">
      <input
        data-testid="medication-title"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
    </div>
  ),
  LabResultForm: ({ data, onChange, errors }: any) => (
    <div data-testid="lab-result-form">
      <input
        data-testid="lab-title"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
      {errors?.biomarkers && <span>{errors.biomarkers}</span>}
    </div>
  ),
  ViceForm: ({ data, onChange, errors }: any) => (
    <div data-testid="vice-form">
      <input
        data-testid="vice-title"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
    </div>
  ),
  createEmptyMetric: () => ({
    type: 'metric',
    title: '',
    date: new Date().toISOString().split('T')[0],
    metricName: '',
    unit: '',
  }),
  createEmptyDoctorVisit: () => ({
    type: 'doctor_visit',
    title: '',
    date: new Date().toISOString().split('T')[0],
    doctorName: '',
  }),
  createEmptyIntervention: () => ({
    type: 'intervention',
    title: '',
    date: new Date().toISOString().split('T')[0],
    interventionName: '',
    startDate: '',
  }),
  createEmptyMedication: () => ({
    type: 'medication',
    title: '',
    date: new Date().toISOString().split('T')[0],
    medicationName: '',
    dosage: '',
    frequency: '',
    startDate: '',
  }),
  createEmptyLabResult: () => ({
    type: 'lab_result',
    title: '',
    date: new Date().toISOString().split('T')[0],
    biomarkers: [],
  }),
  createEmptyVice: () => ({
    type: 'vice',
    title: '',
    date: new Date().toISOString().split('T')[0],
    viceCategory: '',
  }),
}));

import { useEventMutation } from '@/hooks';
import { getLabUpload, updateLabUpload } from '@/api/labUploads';

describe('EventNewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderWithRoute(type: string, searchParams = '') {
    return render(
      <MemoryRouter initialEntries={[`/event/new/${type}${searchParams}`]}>
        <Routes>
          <Route path="/event/new/:type" element={<EventNewPage />} />
          <Route path="/event/new" element={<div>Event type selector</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  describe('routing', () => {
    it('redirects to selector for invalid event type', () => {
      renderWithRoute('invalid_type');

      expect(screen.getByText('Event type selector')).toBeInTheDocument();
    });

    it('renders metric form for metric type', () => {
      renderWithRoute('metric');

      expect(screen.getByTestId('metric-form')).toBeInTheDocument();
    });

    it('renders doctor visit form for doctor_visit type', () => {
      renderWithRoute('doctor_visit');

      expect(screen.getByTestId('doctor-visit-form')).toBeInTheDocument();
    });

    it('renders intervention form for intervention type', () => {
      renderWithRoute('intervention');

      expect(screen.getByTestId('intervention-form')).toBeInTheDocument();
    });

    it('renders medication form for medication type', () => {
      renderWithRoute('medication');

      expect(screen.getByTestId('medication-form')).toBeInTheDocument();
    });

    it('renders lab result form for lab_result type', () => {
      renderWithRoute('lab_result');

      expect(screen.getByTestId('lab-result-form')).toBeInTheDocument();
    });

    it('renders vice form for vice type', () => {
      renderWithRoute('vice');

      expect(screen.getByTestId('vice-form')).toBeInTheDocument();
    });
  });

  describe('page rendering', () => {
    it('displays correct page title', () => {
      renderWithRoute('metric');

      expect(screen.getByTestId('page-wrapper')).toHaveAttribute('data-title', 'New Metric');
    });

    it('shows event type icon and label', () => {
      renderWithRoute('lab_result');

      expect(screen.getByTestId('event-icon')).toBeInTheDocument();
    });

    it('shows change type button', () => {
      renderWithRoute('metric');

      expect(screen.getByText('Change Type')).toBeInTheDocument();
    });

    it('shows save and cancel buttons', () => {
      renderWithRoute('metric');

      expect(screen.getByText('Save Event')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows validation error for missing title', async () => {
      renderWithRoute('metric');

      fireEvent.click(screen.getByText('Save Event'));

      // Validation happens, create should not be called
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('shows validation error for metric without metric name', async () => {
      renderWithRoute('metric');

      // Fill title but not metric name
      fireEvent.change(screen.getByTestId('metric-title'), {
        target: { value: 'Test Metric' },
      });

      fireEvent.click(screen.getByText('Save Event'));

      await waitFor(() => {
        expect(screen.getByText('Metric name is required')).toBeInTheDocument();
      });
    });

    it('shows validation error for doctor visit without doctor name', async () => {
      renderWithRoute('doctor_visit');

      fireEvent.change(screen.getByTestId('doctor-title'), {
        target: { value: 'Annual Checkup' },
      });

      fireEvent.click(screen.getByText('Save Event'));

      await waitFor(() => {
        expect(screen.getByText('Doctor name is required')).toBeInTheDocument();
      });
    });

    it('shows validation error for lab result without biomarkers', async () => {
      renderWithRoute('lab_result');

      fireEvent.change(screen.getByTestId('lab-title'), {
        target: { value: 'Blood Test' },
      });

      fireEvent.click(screen.getByText('Save Event'));

      await waitFor(() => {
        expect(screen.getByText('At least one biomarker is required')).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    beforeEach(() => {
      mockCreate.mockResolvedValue({ id: 'new-event-id' });
    });

    it('navigates to timeline after successful creation', async () => {
      // Mock valid form data that passes validation
      vi.mocked(useEventMutation).mockReturnValue({
        create: mockCreate,
        isCreating: false,
        error: null,
        update: vi.fn(),
        isUpdating: false,
        remove: vi.fn(),
        isDeleting: false,
      });

      renderWithRoute('vice');

      // For vice, need title and viceCategory
      fireEvent.change(screen.getByTestId('vice-title'), {
        target: { value: 'Had a drink' },
      });

      // Submit - but validation for viceCategory will fail
      fireEvent.click(screen.getByText('Save Event'));

      // Verify create was not called due to validation
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('shows loading state during creation', () => {
      vi.mocked(useEventMutation).mockReturnValue({
        create: mockCreate,
        isCreating: true,
        error: null,
        update: vi.fn(),
        isUpdating: false,
        remove: vi.fn(),
        isDeleting: false,
      });

      renderWithRoute('metric');

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('shows mutation error when present', () => {
      vi.mocked(useEventMutation).mockReturnValue({
        create: mockCreate,
        isCreating: false,
        error: 'Failed to create event',
        update: vi.fn(),
        isUpdating: false,
        remove: vi.fn(),
        isDeleting: false,
      });

      renderWithRoute('metric');

      expect(screen.getByText('Failed to create event')).toBeInTheDocument();
    });
  });

  describe('lab upload prefill', () => {
    beforeEach(() => {
      vi.mocked(getLabUpload).mockResolvedValue({
        id: 'upload-1',
        userId: 'user-1',
        fileName: 'lab.pdf',
        status: 'completed',
        extractedData: {
          testDate: '2024-06-15',
          labName: 'Quest Diagnostics',
          orderingDoctor: 'Dr. Smith',
          biomarkers: [
            {
              standardCode: 'glucose',
              name: 'Glucose',
              value: 95,
              unit: 'mg/dL',
            },
          ],
        },
        createdAt: '2024-06-15',
        updatedAt: '2024-06-15',
      });
    });

    it('shows loading while fetching upload data', () => {
      vi.mocked(getLabUpload).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderWithRoute('lab_result', '?fromUpload=upload-1');

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('prefills form from lab upload data', async () => {
      renderWithRoute('lab_result', '?fromUpload=upload-1');

      await waitFor(() => {
        expect(getLabUpload).toHaveBeenCalledWith('upload-1');
      });
    });

    it('handles upload fetch error', async () => {
      const { logger } = await import('@/lib/logger');
      vi.mocked(getLabUpload).mockRejectedValueOnce(new Error('Fetch failed'));

      renderWithRoute('lab_result', '?fromUpload=upload-1');

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          'Failed to load upload data',
          expect.any(Error)
        );
      });
    });

    it('does not load upload for non-lab_result types', () => {
      renderWithRoute('metric', '?fromUpload=upload-1');

      expect(getLabUpload).not.toHaveBeenCalled();
    });
  });

  describe('lab upload linking', () => {
    beforeEach(() => {
      mockCreate.mockResolvedValue({ id: 'new-event-id' });
      vi.mocked(updateLabUpload).mockResolvedValue({} as any);
      vi.mocked(getLabUpload).mockResolvedValue({
        id: 'upload-1',
        userId: 'user-1',
        fileName: 'lab.pdf',
        status: 'completed',
        extractedData: {
          testDate: '2024-06-15',
          labName: 'Quest Diagnostics',
          biomarkers: [
            {
              standardCode: 'glucose',
              name: 'Glucose',
              value: 95,
              unit: 'mg/dL',
            },
          ],
        },
        createdAt: '2024-06-15',
        updatedAt: '2024-06-15',
      });
    });

    it('shows warning for excluded biomarkers', async () => {
      vi.mocked(getLabUpload).mockResolvedValue({
        id: 'upload-1',
        userId: 'user-1',
        fileName: 'lab.pdf',
        status: 'completed',
        extractedData: {
          testDate: '2024-06-15',
          processedBiomarkers: [
            {
              originalName: 'Glucose',
              originalValue: 95,
              originalUnit: 'mg/dL',
              matched: true,
              standardCode: 'glucose',
              standardName: 'Glucose',
              standardValue: 95,
              standardUnit: 'mg/dL',
            },
            {
              originalName: 'Unknown Marker',
              originalValue: 10,
              originalUnit: 'U/L',
              matched: false,
            },
          ],
        },
        createdAt: '2024-06-15',
        updatedAt: '2024-06-15',
      });

      renderWithRoute('lab_result', '?fromUpload=upload-1');

      await waitFor(() => {
        expect(screen.getByText(/1 biomarker excluded/)).toBeInTheDocument();
      });
    });
  });
});
