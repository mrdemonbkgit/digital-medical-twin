import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EventTypeSelector, getEventTypeInfo, eventTypes } from './EventTypeSelector';

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('EventTypeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderWithRouter(ui: React.ReactElement) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  }

  describe('rendering', () => {
    it('renders all 6 event type options', () => {
      renderWithRouter(<EventTypeSelector />);

      expect(screen.getByText('Lab Result')).toBeInTheDocument();
      expect(screen.getByText('Doctor Visit')).toBeInTheDocument();
      expect(screen.getByText('Medication')).toBeInTheDocument();
      expect(screen.getByText('Intervention')).toBeInTheDocument();
      expect(screen.getByText('Metric')).toBeInTheDocument();
      expect(screen.getByText('Vice')).toBeInTheDocument();
    });

    it('renders descriptions for each type', () => {
      renderWithRouter(<EventTypeSelector />);

      expect(screen.getByText(/Blood tests, biomarkers/)).toBeInTheDocument();
      expect(screen.getByText(/Appointments, consultations/)).toBeInTheDocument();
      expect(screen.getByText(/Prescriptions, supplements/)).toBeInTheDocument();
      expect(screen.getByText(/Lifestyle changes/)).toBeInTheDocument();
      expect(screen.getByText(/Health measurements/)).toBeInTheDocument();
      expect(screen.getByText(/Private tracking/)).toBeInTheDocument();
    });

    it('renders 6 buttons', () => {
      renderWithRouter(<EventTypeSelector />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(6);
    });

    it('renders icons for each type', () => {
      renderWithRouter(<EventTypeSelector />);
      // Each type has an icon rendered as SVG
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBe(6);
    });
  });

  describe('navigation', () => {
    it('navigates to lab_result page when Lab Result clicked', () => {
      renderWithRouter(<EventTypeSelector />);
      fireEvent.click(screen.getByText('Lab Result'));
      expect(mockNavigate).toHaveBeenCalledWith('/event/new/lab_result');
    });

    it('navigates to doctor_visit page when Doctor Visit clicked', () => {
      renderWithRouter(<EventTypeSelector />);
      fireEvent.click(screen.getByText('Doctor Visit'));
      expect(mockNavigate).toHaveBeenCalledWith('/event/new/doctor_visit');
    });

    it('navigates to medication page when Medication clicked', () => {
      renderWithRouter(<EventTypeSelector />);
      fireEvent.click(screen.getByText('Medication'));
      expect(mockNavigate).toHaveBeenCalledWith('/event/new/medication');
    });

    it('navigates to intervention page when Intervention clicked', () => {
      renderWithRouter(<EventTypeSelector />);
      fireEvent.click(screen.getByText('Intervention'));
      expect(mockNavigate).toHaveBeenCalledWith('/event/new/intervention');
    });

    it('navigates to metric page when Metric clicked', () => {
      renderWithRouter(<EventTypeSelector />);
      fireEvent.click(screen.getByText('Metric'));
      expect(mockNavigate).toHaveBeenCalledWith('/event/new/metric');
    });

    it('navigates to vice page when Vice clicked', () => {
      renderWithRouter(<EventTypeSelector />);
      fireEvent.click(screen.getByText('Vice'));
      expect(mockNavigate).toHaveBeenCalledWith('/event/new/vice');
    });

    it('does not navigate when navigateOnSelect is false', () => {
      renderWithRouter(<EventTypeSelector navigateOnSelect={false} />);
      fireEvent.click(screen.getByText('Lab Result'));
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('onSelect callback', () => {
    it('calls onSelect with event type when clicked', () => {
      const mockOnSelect = vi.fn();
      renderWithRouter(<EventTypeSelector onSelect={mockOnSelect} />);

      fireEvent.click(screen.getByText('Lab Result'));
      expect(mockOnSelect).toHaveBeenCalledWith('lab_result');
    });

    it('calls onSelect for each type', () => {
      const mockOnSelect = vi.fn();
      renderWithRouter(<EventTypeSelector onSelect={mockOnSelect} navigateOnSelect={false} />);

      fireEvent.click(screen.getByText('Doctor Visit'));
      expect(mockOnSelect).toHaveBeenCalledWith('doctor_visit');

      fireEvent.click(screen.getByText('Medication'));
      expect(mockOnSelect).toHaveBeenCalledWith('medication');
    });
  });

  describe('styling', () => {
    it('applies correct color classes for lab_result', () => {
      renderWithRouter(<EventTypeSelector />);
      const labButton = screen.getByText('Lab Result').closest('button');
      expect(labButton?.className).toContain('bg-red-50');
      expect(labButton?.className).toContain('border-red-200');
    });

    it('applies correct color classes for doctor_visit', () => {
      renderWithRouter(<EventTypeSelector />);
      const doctorButton = screen.getByText('Doctor Visit').closest('button');
      expect(doctorButton?.className).toContain('bg-blue-50');
      expect(doctorButton?.className).toContain('border-blue-200');
    });

    it('applies correct color classes for medication', () => {
      renderWithRouter(<EventTypeSelector />);
      const medButton = screen.getByText('Medication').closest('button');
      expect(medButton?.className).toContain('bg-green-50');
      expect(medButton?.className).toContain('border-green-200');
    });
  });
});

describe('getEventTypeInfo', () => {
  it('returns info for lab_result', () => {
    const info = getEventTypeInfo('lab_result');
    expect(info.type).toBe('lab_result');
    expect(info.label).toBe('Lab Result');
  });

  it('returns info for doctor_visit', () => {
    const info = getEventTypeInfo('doctor_visit');
    expect(info.type).toBe('doctor_visit');
    expect(info.label).toBe('Doctor Visit');
  });

  it('returns info for medication', () => {
    const info = getEventTypeInfo('medication');
    expect(info.type).toBe('medication');
    expect(info.label).toBe('Medication');
  });

  it('returns info for intervention', () => {
    const info = getEventTypeInfo('intervention');
    expect(info.type).toBe('intervention');
    expect(info.label).toBe('Intervention');
  });

  it('returns info for metric', () => {
    const info = getEventTypeInfo('metric');
    expect(info.type).toBe('metric');
    expect(info.label).toBe('Metric');
  });

  it('returns info for vice', () => {
    const info = getEventTypeInfo('vice');
    expect(info.type).toBe('vice');
    expect(info.label).toBe('Vice');
  });

  it('throws for unknown event type', () => {
    expect(() => getEventTypeInfo('unknown' as any)).toThrow('Unknown event type: unknown');
  });
});

describe('eventTypes export', () => {
  it('exports array with 6 event types', () => {
    expect(eventTypes).toHaveLength(6);
  });

  it('contains all expected types', () => {
    const types = eventTypes.map(et => et.type);
    expect(types).toContain('lab_result');
    expect(types).toContain('doctor_visit');
    expect(types).toContain('medication');
    expect(types).toContain('intervention');
    expect(types).toContain('metric');
    expect(types).toContain('vice');
  });

  it('each type has required properties', () => {
    for (const eventType of eventTypes) {
      expect(eventType).toHaveProperty('type');
      expect(eventType).toHaveProperty('label');
      expect(eventType).toHaveProperty('description');
      expect(eventType).toHaveProperty('icon');
      expect(eventType).toHaveProperty('colors');
      expect(eventType.colors).toHaveProperty('bg');
      expect(eventType.colors).toHaveProperty('border');
      expect(eventType.colors).toHaveProperty('hover');
      expect(eventType.colors).toHaveProperty('icon');
    }
  });
});
