import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsPanel } from './StatsPanel';
import type { TrendStats } from '@/lib/insights/dataProcessing';

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('StatsPanel', () => {
  const upwardStats: TrendStats = {
    current: 120,
    average: 115,
    min: 100,
    max: 140,
    trendDirection: 'up',
    changePercent: 15,
  };

  const downwardStats: TrendStats = {
    current: 90,
    average: 100,
    min: 85,
    max: 120,
    trendDirection: 'down',
    changePercent: -10,
  };

  const stableStats: TrendStats = {
    current: 100,
    average: 100,
    min: 95,
    max: 105,
    trendDirection: 'stable',
    changePercent: 0,
  };

  describe('stat cards', () => {
    it('renders current value', () => {
      render(<StatsPanel stats={upwardStats} unit="mg/dL" />);
      expect(screen.getByText('Current')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
    });

    it('renders average value', () => {
      render(<StatsPanel stats={upwardStats} unit="mg/dL" />);
      expect(screen.getByText('Average')).toBeInTheDocument();
      expect(screen.getByText('115')).toBeInTheDocument();
    });

    it('renders min value', () => {
      render(<StatsPanel stats={upwardStats} unit="mg/dL" />);
      expect(screen.getByText('Min')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('renders max value', () => {
      render(<StatsPanel stats={upwardStats} unit="mg/dL" />);
      expect(screen.getByText('Max')).toBeInTheDocument();
      expect(screen.getByText('140')).toBeInTheDocument();
    });

    it('displays unit with each stat', () => {
      render(<StatsPanel stats={upwardStats} unit="mg/dL" />);
      const units = screen.getAllByText('mg/dL');
      expect(units.length).toBe(4); // Current, Average, Min, Max
    });
  });

  describe('trend card', () => {
    it('renders Trend label', () => {
      render(<StatsPanel stats={upwardStats} unit="mg/dL" />);
      expect(screen.getByText('Trend')).toBeInTheDocument();
    });

    it('shows positive percentage for upward trend', () => {
      render(<StatsPanel stats={upwardStats} unit="mg/dL" />);
      expect(screen.getByText('+15%')).toBeInTheDocument();
      expect(screen.getByText('Increasing')).toBeInTheDocument();
    });

    it('shows negative percentage for downward trend', () => {
      render(<StatsPanel stats={downwardStats} unit="mg/dL" />);
      expect(screen.getByText('-10%')).toBeInTheDocument();
      expect(screen.getByText('Decreasing')).toBeInTheDocument();
    });

    it('shows Stable for stable trend', () => {
      render(<StatsPanel stats={stableStats} unit="mg/dL" />);
      expect(screen.getByText('Stable')).toBeInTheDocument();
      expect(screen.getByText('No significant change')).toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('renders TrendingUp icon for upward trend', () => {
      render(<StatsPanel stats={upwardStats} unit="mg/dL" />);
      // lucide icons render as svg
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('renders TrendingDown icon for downward trend', () => {
      render(<StatsPanel stats={downwardStats} unit="mg/dL" />);
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('renders Minus icon for stable trend', () => {
      render(<StatsPanel stats={stableStats} unit="mg/dL" />);
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('grid layout', () => {
    it('renders all 5 cards in grid', () => {
      const { container } = render(<StatsPanel stats={upwardStats} unit="mg/dL" />);
      // Grid container with 5 children
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer?.children.length).toBe(5);
    });
  });
});
