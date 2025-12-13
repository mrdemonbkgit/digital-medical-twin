import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner, FullPageSpinner } from './LoadingSpinner';

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('LoadingSpinner', () => {
  describe('rendering', () => {
    it('renders spinner icon', () => {
      render(<LoadingSpinner />);
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('has animation class', () => {
      render(<LoadingSpinner />);
      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });

    it('has accent color', () => {
      render(<LoadingSpinner />);
      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('text-accent');
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      render(<LoadingSpinner size="sm" />);
      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('h-4', 'w-4');
    });

    it('renders medium size by default', () => {
      render(<LoadingSpinner />);
      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('h-8', 'w-8');
    });

    it('renders medium size explicitly', () => {
      render(<LoadingSpinner size="md" />);
      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('h-8', 'w-8');
    });

    it('renders large size', () => {
      render(<LoadingSpinner size="lg" />);
      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('h-12', 'w-12');
    });
  });

  describe('container', () => {
    it('wraps icon in flex container', () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toHaveClass('flex');
    });

    it('centers content', () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toHaveClass('items-center', 'justify-center');
    });
  });

  describe('styling', () => {
    it('applies custom className to container', () => {
      const { container } = render(<LoadingSpinner className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('preserves default classes with custom className', () => {
      const { container } = render(<LoadingSpinner className="mt-4" />);
      expect(container.firstChild).toHaveClass('flex', 'mt-4');
    });
  });
});

describe('FullPageSpinner', () => {
  describe('rendering', () => {
    it('renders spinner', () => {
      render(<FullPageSpinner />);
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('uses large size spinner', () => {
      render(<FullPageSpinner />);
      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('h-12', 'w-12');
    });
  });

  describe('layout', () => {
    it('has full screen height', () => {
      const { container } = render(<FullPageSpinner />);
      expect(container.firstChild).toHaveClass('min-h-screen');
    });

    it('is a flex container', () => {
      const { container } = render(<FullPageSpinner />);
      expect(container.firstChild).toHaveClass('flex');
    });

    it('centers content horizontally and vertically', () => {
      const { container } = render(<FullPageSpinner />);
      expect(container.firstChild).toHaveClass('items-center', 'justify-center');
    });
  });

  describe('usage context', () => {
    it('can be used for page loading states', () => {
      const { container } = render(<FullPageSpinner />);
      // Verify it takes up the full viewport
      expect(container.firstChild).toHaveClass('min-h-screen');
      // Verify spinner is visible and centered
      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });
  });
});

describe('LoadingSpinner accessibility', () => {
  it('spinner is presentational', () => {
    render(<LoadingSpinner />);
    // The spinner itself is just a visual indicator
    // It should be used with aria-busy or aria-live regions
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('can be hidden from screen readers with aria-hidden parent', () => {
    render(
      <div aria-hidden="true">
        <LoadingSpinner />
      </div>
    );
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
