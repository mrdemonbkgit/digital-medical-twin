import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlagsBanner } from './FlagsBanner';
import type { FlagCounts } from '@/lib/insights/dataProcessing';

describe('FlagsBanner', () => {
  describe('no flags', () => {
    it('shows all normal message when no flags', () => {
      const flagCounts: FlagCounts = { high: 0, low: 0 };

      render(<FlagsBanner flagCounts={flagCounts} />);

      expect(screen.getByText('All biomarkers within normal range')).toBeInTheDocument();
    });

    it('renders with green background when all normal', () => {
      const flagCounts: FlagCounts = { high: 0, low: 0 };

      const { container } = render(<FlagsBanner flagCounts={flagCounts} />);

      const banner = container.firstChild as HTMLElement;
      expect(banner).toHaveClass('bg-green-50');
    });

    it('does not show high or low badges when none', () => {
      const flagCounts: FlagCounts = { high: 0, low: 0 };

      render(<FlagsBanner flagCounts={flagCounts} />);

      expect(screen.queryByText(/High/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Low/)).not.toBeInTheDocument();
    });
  });

  describe('high flags only', () => {
    it('shows high count badge', () => {
      const flagCounts: FlagCounts = { high: 3, low: 0 };

      render(<FlagsBanner flagCounts={flagCounts} />);

      expect(screen.getByText('3 High')).toBeInTheDocument();
    });

    it('does not show low badge when no lows', () => {
      const flagCounts: FlagCounts = { high: 2, low: 0 };

      render(<FlagsBanner flagCounts={flagCounts} />);

      expect(screen.queryByText(/Low/)).not.toBeInTheDocument();
    });

    it('renders high badge with red styling', () => {
      const flagCounts: FlagCounts = { high: 1, low: 0 };

      const { container } = render(<FlagsBanner flagCounts={flagCounts} />);

      const badge = container.querySelector('.bg-red-100');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('low flags only', () => {
    it('shows low count badge', () => {
      const flagCounts: FlagCounts = { high: 0, low: 5 };

      render(<FlagsBanner flagCounts={flagCounts} />);

      expect(screen.getByText('5 Low')).toBeInTheDocument();
    });

    it('does not show high badge when no highs', () => {
      const flagCounts: FlagCounts = { high: 0, low: 2 };

      render(<FlagsBanner flagCounts={flagCounts} />);

      expect(screen.queryByText(/High/)).not.toBeInTheDocument();
    });

    it('renders low badge with amber styling', () => {
      const flagCounts: FlagCounts = { high: 0, low: 1 };

      const { container } = render(<FlagsBanner flagCounts={flagCounts} />);

      const badge = container.querySelector('.bg-amber-100');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('both high and low flags', () => {
    it('shows both badges when both present', () => {
      const flagCounts: FlagCounts = { high: 2, low: 3 };

      render(<FlagsBanner flagCounts={flagCounts} />);

      expect(screen.getByText('2 High')).toBeInTheDocument();
      expect(screen.getByText('3 Low')).toBeInTheDocument();
    });

    it('renders both badge styles', () => {
      const flagCounts: FlagCounts = { high: 1, low: 1 };

      const { container } = render(<FlagsBanner flagCounts={flagCounts} />);

      expect(container.querySelector('.bg-red-100')).toBeInTheDocument();
      expect(container.querySelector('.bg-amber-100')).toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('renders warning icons with flags', () => {
      const flagCounts: FlagCounts = { high: 1, low: 1 };

      const { container } = render(<FlagsBanner flagCounts={flagCounts} />);

      // Should have 2 warning icons (one for each badge)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(2);
    });
  });
});
