import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useRequireProfile', () => ({
  useRequireProfile: vi.fn(),
}));

vi.mock('@/hooks', () => ({
  useEvents: vi.fn(),
  useEventMutation: vi.fn(),
}));

// Mock components
vi.mock('@/components/layout', () => ({
  PageWrapper: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-wrapper" data-title={title}>{children}</div>
  ),
}));

vi.mock('@/components/common', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  Button: ({ children, onClick, variant, size, className }: { children: React.ReactNode; onClick?: () => void; variant?: string; size?: string; className?: string }) => (
    <button onClick={onClick} data-variant={variant} data-size={size} className={className}>{children}</button>
  ),
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
  FullPageSpinner: () => <div data-testid="full-page-spinner">Loading...</div>,
}));

vi.mock('@/components/event', () => ({
  EventCard: ({ event, onDelete, isDeleting }: { event: { id: string; title: string }; onDelete: (id: string) => void; isDeleting: boolean }) => (
    <div data-testid={`event-card-${event.id}`}>
      <span>{event.title}</span>
      <button onClick={() => onDelete(event.id)} disabled={isDeleting}>Delete</button>
    </div>
  ),
  eventTypes: [
    { type: 'medication', label: 'Medication', icon: () => <span>💊</span>, colors: { bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:border-blue-400', icon: 'text-blue-600' } },
    { type: 'lab_result', label: 'Lab Result', icon: () => <span>🧪</span>, colors: { bg: 'bg-green-50', border: 'border-green-200', hover: 'hover:border-green-400', icon: 'text-green-600' } },
  ],
}));

import { useAuth } from '@/hooks/useAuth';
import { useRequireProfile } from '@/hooks/useRequireProfile';
import { useEvents, useEventMutation } from '@/hooks';

const mockUseAuth = vi.mocked(useAuth);
const mockUseRequireProfile = vi.mocked(useRequireProfile);
const mockUseEvents = vi.mocked(useEvents);
const mockUseEventMutation = vi.mocked(useEventMutation);

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    } as ReturnType<typeof useAuth>);
    mockUseEventMutation.mockReturnValue({
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
    });
  });

  describe('profile loading', () => {
    it('shows full page spinner while profile is loading', () => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: true,
        isComplete: false,
        profile: null,
      });
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        hasMore: false,
        loadMore: vi.fn(),
        total: 0,
      });

      renderWithRouter();

      expect(screen.getByTestId('full-page-spinner')).toBeInTheDocument();
    });

    it('returns null when profile is not complete', () => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: false,
        isComplete: false,
        profile: null,
      });
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        hasMore: false,
        loadMore: vi.fn(),
        total: 0,
      });

      const { container } = renderWithRouter();

      expect(container.firstChild).toBeNull();
    });
  });

  describe('welcome card', () => {
    beforeEach(() => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: false,
        isComplete: true,
        profile: { displayName: 'John Doe' },
      });
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        hasMore: false,
        loadMore: vi.fn(),
        total: 0,
      });
    });

    it('displays welcome message with profile name', () => {
      renderWithRouter();

      expect(screen.getByText('Welcome back, John Doe')).toBeInTheDocument();
    });

    it('falls back to email prefix when no display name', () => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: false,
        isComplete: true,
        profile: { displayName: null },
      });

      renderWithRouter();

      expect(screen.getByText('Welcome back, test')).toBeInTheDocument();
    });

    it('shows tagline', () => {
      renderWithRouter();

      expect(screen.getByText('Your digital medical twin is tracking your health journey.')).toBeInTheDocument();
    });
  });

  describe('quick add section', () => {
    beforeEach(() => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: false,
        isComplete: true,
        profile: { displayName: 'John' },
      });
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        hasMore: false,
        loadMore: vi.fn(),
        total: 0,
      });
    });

    it('renders quick add section title', () => {
      renderWithRouter();

      expect(screen.getByText('Quick Add')).toBeInTheDocument();
    });

    it('renders event type links', () => {
      renderWithRouter();

      expect(screen.getByText('Medication')).toBeInTheDocument();
      expect(screen.getByText('Lab Result')).toBeInTheDocument();
    });

    it('renders upload lab link', () => {
      renderWithRouter();

      expect(screen.getByText('Upload Lab')).toBeInTheDocument();
    });
  });

  describe('recent events - loading', () => {
    it('shows loading spinner while events are loading', () => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: false,
        isComplete: true,
        profile: { displayName: 'John' },
      });
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        hasMore: false,
        loadMore: vi.fn(),
        total: 0,
      });

      renderWithRouter();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('recent events - empty state', () => {
    beforeEach(() => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: false,
        isComplete: true,
        profile: { displayName: 'John' },
      });
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        hasMore: false,
        loadMore: vi.fn(),
        total: 0,
      });
    });

    it('shows empty state message', () => {
      renderWithRouter();

      expect(screen.getByText('No health events yet')).toBeInTheDocument();
      expect(screen.getByText('Start tracking your health by adding your first event.')).toBeInTheDocument();
    });

    it('shows add event button in empty state', () => {
      renderWithRouter();

      expect(screen.getByText('Add Health Event')).toBeInTheDocument();
    });
  });

  describe('recent events - with data', () => {
    const mockEvents = [
      { id: '1', title: 'Blood Test', type: 'lab_result', date: '2024-01-01' },
      { id: '2', title: 'Aspirin', type: 'medication', date: '2024-01-02' },
    ];

    beforeEach(() => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: false,
        isComplete: true,
        profile: { displayName: 'John' },
      });
      mockUseEvents.mockReturnValue({
        events: mockEvents,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        hasMore: false,
        loadMore: vi.fn(),
        total: 2,
      });
    });

    it('renders event cards', () => {
      renderWithRouter();

      expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('event-card-2')).toBeInTheDocument();
    });

    it('renders view all button in header', () => {
      renderWithRouter();

      expect(screen.getByText('View All')).toBeInTheDocument();
    });
  });

  describe('recent events - view all button', () => {
    const mockEvents = Array(5).fill(null).map((_, i) => ({
      id: String(i + 1),
      title: `Event ${i + 1}`,
      type: 'medication',
      date: '2024-01-01',
    }));

    beforeEach(() => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: false,
        isComplete: true,
        profile: { displayName: 'John' },
      });
      mockUseEvents.mockReturnValue({
        events: mockEvents,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        hasMore: true,
        loadMore: vi.fn(),
        total: 10,
      });
    });

    it('shows view all events button when 5 or more events', () => {
      renderWithRouter();

      expect(screen.getByText('View All Events')).toBeInTheDocument();
    });
  });

  describe('event deletion', () => {
    const mockRemove = vi.fn().mockResolvedValue(undefined);
    const mockRefetch = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: false,
        isComplete: true,
        profile: { displayName: 'John' },
      });
      mockUseEvents.mockReturnValue({
        events: [{ id: '1', title: 'Test Event', type: 'medication', date: '2024-01-01' }],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        hasMore: false,
        loadMore: vi.fn(),
        total: 1,
      });
      mockUseEventMutation.mockReturnValue({
        create: vi.fn(),
        update: vi.fn(),
        remove: mockRemove,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
      });
    });

    it('calls remove and refetch when deleting event', async () => {
      renderWithRouter();

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith('1');
      });

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });
  });
});
