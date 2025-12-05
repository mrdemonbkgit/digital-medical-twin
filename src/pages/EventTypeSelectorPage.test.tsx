import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EventTypeSelectorPage } from './EventTypeSelectorPage';

// Mock components
vi.mock('@/components/layout', () => ({
  PageWrapper: ({ children, title, action }: { children: React.ReactNode; title: string; action?: React.ReactNode }) => (
    <div data-testid="page-wrapper" data-title={title}>
      {action && <div data-testid="page-action">{action}</div>}
      {children}
    </div>
  ),
}));

vi.mock('@/components/common', () => ({
  Button: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <button data-variant={variant}>{children}</button>
  ),
}));

vi.mock('@/components/event', () => ({
  EventTypeSelector: () => <div data-testid="event-type-selector">Event Type Selector</div>,
}));

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <EventTypeSelectorPage />
    </MemoryRouter>
  );
};

describe('EventTypeSelectorPage', () => {
  describe('page structure', () => {
    it('renders page wrapper with title', () => {
      renderWithRouter();

      expect(screen.getByTestId('page-wrapper')).toHaveAttribute('data-title', 'Add New Event');
    });

    it('renders back button in action area', () => {
      renderWithRouter();

      expect(screen.getByTestId('page-action')).toBeInTheDocument();
      expect(screen.getByText('Back to Timeline')).toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('renders instruction text', () => {
      renderWithRouter();

      expect(screen.getByText('What type of health event would you like to record?')).toBeInTheDocument();
    });

    it('renders event type selector', () => {
      renderWithRouter();

      expect(screen.getByTestId('event-type-selector')).toBeInTheDocument();
    });
  });
});
