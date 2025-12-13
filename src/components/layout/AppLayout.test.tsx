import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './AppLayout';

// Mock Header component
vi.mock('./Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

// Mock ErrorBoundary
vi.mock('@/components/common', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

describe('AppLayout', () => {
  function renderWithRouter(initialPath = '/') {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div data-testid="home">Home Page</div>} />
            <Route path="/about" element={<div data-testid="about">About Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  }

  describe('rendering', () => {
    it('renders Header component', () => {
      renderWithRouter();

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('renders ErrorBoundary wrapper', () => {
      renderWithRouter();

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });

    it('renders child route content via Outlet', () => {
      renderWithRouter('/');

      expect(screen.getByTestId('home')).toBeInTheDocument();
    });

    it('renders different page based on route', () => {
      renderWithRouter('/about');

      expect(screen.getByTestId('about')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies min-height screen and theme background', () => {
      const { container } = renderWithRouter();

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('min-h-screen', 'bg-theme-secondary');
    });
  });

  describe('structure', () => {
    it('has Header before ErrorBoundary', () => {
      const { container } = renderWithRouter();

      const wrapper = container.firstChild as HTMLElement;
      const children = wrapper.children;

      expect(children[0]).toHaveAttribute('data-testid', 'header');
      expect(children[1]).toHaveAttribute('data-testid', 'error-boundary');
    });
  });
});
