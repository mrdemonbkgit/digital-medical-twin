import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AddEventFAB } from './AddEventFAB';

// Mock cn utility
vi.mock('@/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('AddEventFAB', () => {
  function renderWithRouter(ui: React.ReactElement) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  }

  describe('rendering', () => {
    it('renders a link element', () => {
      renderWithRouter(<AddEventFAB />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('links to /event/new', () => {
      renderWithRouter(<AddEventFAB />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/event/new');
    });

    it('has accessible label', () => {
      renderWithRouter(<AddEventFAB />);
      expect(screen.getByLabelText('Add new event')).toBeInTheDocument();
    });

    it('renders plus icon', () => {
      renderWithRouter(<AddEventFAB />);
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has fixed positioning classes', () => {
      renderWithRouter(<AddEventFAB />);
      const link = screen.getByRole('link');
      expect(link.className).toContain('fixed');
      expect(link.className).toContain('bottom-6');
      expect(link.className).toContain('right-6');
    });

    it('has rounded-full class for circular shape', () => {
      renderWithRouter(<AddEventFAB />);
      const link = screen.getByRole('link');
      expect(link.className).toContain('rounded-full');
    });

    it('has primary color classes', () => {
      renderWithRouter(<AddEventFAB />);
      const link = screen.getByRole('link');
      expect(link.className).toContain('bg-blue-600');
      expect(link.className).toContain('text-white');
    });

    it('has shadow class', () => {
      renderWithRouter(<AddEventFAB />);
      const link = screen.getByRole('link');
      expect(link.className).toContain('shadow-lg');
    });

    it('applies custom className', () => {
      renderWithRouter(<AddEventFAB className="custom-class" />);
      const link = screen.getByRole('link');
      expect(link.className).toContain('custom-class');
    });

    it('has z-index for overlay positioning', () => {
      renderWithRouter(<AddEventFAB />);
      const link = screen.getByRole('link');
      expect(link.className).toContain('z-50');
    });
  });

  describe('dimensions', () => {
    it('has proper size classes', () => {
      renderWithRouter(<AddEventFAB />);
      const link = screen.getByRole('link');
      expect(link.className).toContain('h-14');
      expect(link.className).toContain('w-14');
    });
  });

  describe('hover effects', () => {
    it('has hover scale effect class', () => {
      renderWithRouter(<AddEventFAB />);
      const link = screen.getByRole('link');
      expect(link.className).toContain('hover:scale-105');
    });

    it('has hover color change class', () => {
      renderWithRouter(<AddEventFAB />);
      const link = screen.getByRole('link');
      expect(link.className).toContain('hover:bg-blue-700');
    });
  });

  describe('focus styles', () => {
    it('has focus ring classes', () => {
      renderWithRouter(<AddEventFAB />);
      const link = screen.getByRole('link');
      expect(link.className).toContain('focus:ring-2');
      expect(link.className).toContain('focus:ring-blue-500');
    });
  });

  describe('active state', () => {
    it('has active scale class', () => {
      renderWithRouter(<AddEventFAB />);
      const link = screen.getByRole('link');
      expect(link.className).toContain('active:scale-95');
    });
  });
});
