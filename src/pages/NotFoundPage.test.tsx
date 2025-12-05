import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';

// Mock components
vi.mock('@/components/common', () => ({
  Button: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <button className={className}>{children}</button>
  ),
}));

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>
  );
};

describe('NotFoundPage', () => {
  describe('content', () => {
    it('renders 404 heading', () => {
      renderWithRouter();

      expect(screen.getByText('404')).toBeInTheDocument();
    });

    it('renders page not found message', () => {
      renderWithRouter();

      expect(screen.getByText('Page not found')).toBeInTheDocument();
    });

    it('renders description text', () => {
      renderWithRouter();

      expect(screen.getByText("The page you're looking for doesn't exist or has been moved.")).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('renders go home button', () => {
      renderWithRouter();

      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });

    it('has link to home route', () => {
      renderWithRouter();

      const link = screen.getByText('Go Home').closest('a');
      expect(link).toHaveAttribute('href', '/');
    });
  });
});
