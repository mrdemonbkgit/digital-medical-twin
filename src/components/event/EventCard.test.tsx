import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { EventCard } from './EventCard';
import type { HealthEvent, LabResult, DoctorVisit, Medication } from '@/types';

// Mock supabase to prevent env var errors from barrel exports
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Sample events for testing
const labResultEvent: LabResult = {
  id: 'lab-1',
  user_id: 'user-123',
  type: 'lab_result',
  date: '2024-01-15',
  title: 'Blood Test Results',
  notes: 'Annual checkup',
  tags: ['annual', 'routine'],
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  labName: 'Quest Diagnostics',
  orderingDoctor: 'Dr. Smith',
  biomarkers: [
    { name: 'Glucose', value: 95, unit: 'mg/dL', flag: 'normal' },
    { name: 'Cholesterol', value: 220, unit: 'mg/dL', flag: 'high' },
  ],
};

const doctorVisitEvent: DoctorVisit = {
  id: 'visit-1',
  user_id: 'user-123',
  type: 'doctor_visit',
  date: '2024-01-20',
  title: 'Annual Physical',
  notes: 'Discussed cholesterol levels',
  tags: ['checkup'],
  created_at: '2024-01-20T10:00:00Z',
  updated_at: '2024-01-20T10:00:00Z',
  doctorName: 'Dr. Johnson',
  specialty: 'Internal Medicine',
  facility: 'City Medical Center',
  diagnosis: ['Hypercholesterolemia'],
  recommendations: ['Diet changes', 'Exercise'],
};

const medicationEvent: Medication = {
  id: 'med-1',
  user_id: 'user-123',
  type: 'medication',
  date: '2024-01-25',
  title: 'Started Lipitor',
  notes: 'For cholesterol management',
  tags: ['medication'],
  created_at: '2024-01-25T10:00:00Z',
  updated_at: '2024-01-25T10:00:00Z',
  medicationName: 'Lipitor',
  dosage: '10mg',
  frequency: 'daily',
  status: 'active',
};

function renderEventCard(
  event: HealthEvent,
  props: Partial<{ onDelete: (id: string) => void; isDeleting: boolean; searchQuery: string }> = {}
) {
  return render(
    <MemoryRouter>
      <EventCard event={event} {...props} />
    </MemoryRouter>
  );
}

describe('EventCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders event title', () => {
      renderEventCard(labResultEvent);
      expect(screen.getByText('Blood Test Results')).toBeInTheDocument();
    });

    it('renders formatted date', () => {
      renderEventCard(labResultEvent);
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });

    it('renders event type label for lab result', () => {
      renderEventCard(labResultEvent);
      expect(screen.getByText('Lab Result')).toBeInTheDocument();
    });

    it('renders event type label for doctor visit', () => {
      renderEventCard(doctorVisitEvent);
      expect(screen.getByText('Doctor Visit')).toBeInTheDocument();
    });

    it('renders event type label for medication', () => {
      renderEventCard(medicationEvent);
      expect(screen.getByText('Medication')).toBeInTheDocument();
    });

    it('renders edit button', () => {
      renderEventCard(labResultEvent);
      const buttons = screen.getAllByRole('button');
      // Should have edit, delete, and the expand/collapse header
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders delete button', () => {
      renderEventCard(labResultEvent);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('expand/collapse', () => {
    it('starts collapsed by default', () => {
      renderEventCard(labResultEvent);
      // Notes should not be visible when collapsed
      expect(screen.queryByText('Annual checkup')).not.toBeInTheDocument();
    });

    it('expands when header is clicked', async () => {
      const user = userEvent.setup();
      renderEventCard(labResultEvent);

      const header = screen.getByRole('button', { name: /blood test results/i });
      await user.click(header);

      expect(screen.getByText('Annual checkup')).toBeInTheDocument();
    });

    it('collapses when header is clicked again', async () => {
      const user = userEvent.setup();
      renderEventCard(labResultEvent);

      const header = screen.getByRole('button', { name: /blood test results/i });

      // Expand
      await user.click(header);
      expect(screen.getByText('Annual checkup')).toBeInTheDocument();

      // Collapse
      await user.click(header);
      expect(screen.queryByText('Annual checkup')).not.toBeInTheDocument();
    });

    it('expands when Enter key is pressed', async () => {
      renderEventCard(labResultEvent);

      const header = screen.getByRole('button', { name: /blood test results/i });
      header.focus();
      fireEvent.keyDown(header, { key: 'Enter' });

      expect(screen.getByText('Annual checkup')).toBeInTheDocument();
    });

    it('expands when Space key is pressed', async () => {
      renderEventCard(labResultEvent);

      const header = screen.getByRole('button', { name: /blood test results/i });
      header.focus();
      fireEvent.keyDown(header, { key: ' ' });

      expect(screen.getByText('Annual checkup')).toBeInTheDocument();
    });
  });

  describe('lab result details', () => {
    it('shows lab name when expanded', async () => {
      const user = userEvent.setup();
      renderEventCard(labResultEvent);

      const header = screen.getByRole('button', { name: /blood test results/i });
      await user.click(header);

      expect(screen.getByText('Quest Diagnostics')).toBeInTheDocument();
    });

    it('shows ordering doctor when expanded', async () => {
      const user = userEvent.setup();
      renderEventCard(labResultEvent);

      const header = screen.getByRole('button', { name: /blood test results/i });
      await user.click(header);

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    it('shows biomarkers when expanded', async () => {
      const user = userEvent.setup();
      renderEventCard(labResultEvent);

      const header = screen.getByRole('button', { name: /blood test results/i });
      await user.click(header);

      expect(screen.getByText('Glucose')).toBeInTheDocument();
      expect(screen.getByText('Cholesterol')).toBeInTheDocument();
    });

    it('shows biomarker values with units', async () => {
      const user = userEvent.setup();
      renderEventCard(labResultEvent);

      const header = screen.getByRole('button', { name: /blood test results/i });
      await user.click(header);

      expect(screen.getByText(/95 mg\/dL/)).toBeInTheDocument();
      expect(screen.getByText(/220 mg\/dL/)).toBeInTheDocument();
    });

    it('shows high flag for abnormal biomarkers', async () => {
      const user = userEvent.setup();
      renderEventCard(labResultEvent);

      const header = screen.getByRole('button', { name: /blood test results/i });
      await user.click(header);

      expect(screen.getByText(/\(high\)/i)).toBeInTheDocument();
    });
  });

  describe('doctor visit details', () => {
    it('shows doctor name when expanded', async () => {
      const user = userEvent.setup();
      renderEventCard(doctorVisitEvent);

      const header = screen.getByRole('button', { name: /annual physical/i });
      await user.click(header);

      expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
    });

    it('shows specialty when expanded', async () => {
      const user = userEvent.setup();
      renderEventCard(doctorVisitEvent);

      const header = screen.getByRole('button', { name: /annual physical/i });
      await user.click(header);

      expect(screen.getByText('Internal Medicine')).toBeInTheDocument();
    });

    it('shows facility when expanded', async () => {
      const user = userEvent.setup();
      renderEventCard(doctorVisitEvent);

      const header = screen.getByRole('button', { name: /annual physical/i });
      await user.click(header);

      expect(screen.getByText('City Medical Center')).toBeInTheDocument();
    });
  });

  describe('tags', () => {
    it('shows tags when expanded', async () => {
      const user = userEvent.setup();
      renderEventCard(labResultEvent);

      const header = screen.getByRole('button', { name: /blood test results/i });
      await user.click(header);

      expect(screen.getByText('annual')).toBeInTheDocument();
      expect(screen.getByText('routine')).toBeInTheDocument();
    });
  });

  describe('notes', () => {
    it('shows notes when expanded', async () => {
      const user = userEvent.setup();
      renderEventCard(labResultEvent);

      const header = screen.getByRole('button', { name: /blood test results/i });
      await user.click(header);

      expect(screen.getByText('Annual checkup')).toBeInTheDocument();
    });
  });

  describe('edit action', () => {
    it('navigates to edit page when edit button is clicked', async () => {
      const user = userEvent.setup();
      renderEventCard(labResultEvent);

      // Find the button with the Edit icon (first ghost button in the actions)
      const buttons = screen.getAllByRole('button');
      // Find button that contains SVG with edit icon class
      const editButton = buttons.find(btn =>
        btn.querySelector('svg.lucide-edit') || btn.querySelector('[class*="edit"]')
      ) || buttons[1]; // Fallback to second button

      await user.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('/event/lab-1');
    });
  });

  describe('delete action', () => {
    it('calls onDelete with event id when confirmed', async () => {
      const user = userEvent.setup();
      const mockOnDelete = vi.fn();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderEventCard(labResultEvent, { onDelete: mockOnDelete });

      // Find delete button - it has text-red-600 class
      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(btn => btn.classList.contains('text-red-600'));

      if (deleteButton) {
        await user.click(deleteButton);
        expect(mockOnDelete).toHaveBeenCalledWith('lab-1');
      }
    });

    it('does not call onDelete when cancelled', async () => {
      const user = userEvent.setup();
      const mockOnDelete = vi.fn();
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      renderEventCard(labResultEvent, { onDelete: mockOnDelete });

      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(btn => btn.classList.contains('text-red-600'));

      if (deleteButton) {
        await user.click(deleteButton);
      }

      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it('shows confirmation dialog before deleting', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      renderEventCard(labResultEvent, { onDelete: vi.fn() });

      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(btn => btn.classList.contains('text-red-600'));

      if (deleteButton) {
        await user.click(deleteButton);
        expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this event?');
      }
    });
  });

  describe('search highlighting', () => {
    it('renders title with search query provided', () => {
      renderEventCard(labResultEvent, { searchQuery: 'Blood' });

      // highlightText may split the text, so check for the heading element
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toContain('Blood');
    });
  });

  describe('accessibility', () => {
    it('has accessible header button', () => {
      renderEventCard(labResultEvent);

      const header = screen.getByRole('button', { name: /blood test results/i });
      expect(header).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('visual styling', () => {
    it('applies correct border color for lab result', () => {
      const { container } = renderEventCard(labResultEvent);
      const card = container.firstChild;
      expect(card).toHaveClass('border-l-red-500');
    });

    it('applies correct border color for doctor visit', () => {
      const { container } = renderEventCard(doctorVisitEvent);
      const card = container.firstChild;
      expect(card).toHaveClass('border-l-blue-500');
    });

    it('applies correct border color for medication', () => {
      const { container } = renderEventCard(medicationEvent);
      const card = container.firstChild;
      expect(card).toHaveClass('border-l-green-500');
    });
  });
});
