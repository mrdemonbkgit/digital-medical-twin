import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WebSearchStep } from './WebSearchStep';
import type { ActivityItem } from '@/types/ai';

describe('WebSearchStep', () => {
  const createActivity = (sources: any[]): ActivityItem => ({
    type: 'web_search',
    title: 'Web Search',
    description: 'Searching...',
    status: 'completed',
    timestamp: new Date().toISOString(),
    sources,
  });

  describe('rendering', () => {
    it('returns null when no sources', () => {
      const activities: ActivityItem[] = [createActivity([])];

      const { container } = render(<WebSearchStep activities={activities} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders search title', () => {
      const activities: ActivityItem[] = [
        createActivity([
          { url: 'https://example.com', title: 'Example', snippet: 'Test' },
        ]),
      ];

      render(<WebSearchStep activities={activities} />);

      expect(screen.getByText('Searching for relevant information')).toBeInTheDocument();
    });

    it('renders source chips', () => {
      const activities: ActivityItem[] = [
        createActivity([
          { url: 'https://example.com', title: 'Example Site', snippet: 'Test' },
        ]),
      ];

      render(<WebSearchStep activities={activities} />);

      expect(screen.getByText('[1]')).toBeInTheDocument();
      expect(screen.getByText('Example Site')).toBeInTheDocument();
    });
  });

  describe('source display', () => {
    it('shows first 3 sources by default', () => {
      const activities: ActivityItem[] = [
        createActivity([
          { url: 'https://example1.com', title: 'Source 1', snippet: '' },
          { url: 'https://example2.com', title: 'Source 2', snippet: '' },
          { url: 'https://example3.com', title: 'Source 3', snippet: '' },
          { url: 'https://example4.com', title: 'Source 4', snippet: '' },
          { url: 'https://example5.com', title: 'Source 5', snippet: '' },
        ]),
      ];

      render(<WebSearchStep activities={activities} />);

      expect(screen.getByText('Source 1')).toBeInTheDocument();
      expect(screen.getByText('Source 2')).toBeInTheDocument();
      expect(screen.getByText('Source 3')).toBeInTheDocument();
      expect(screen.queryByText('Source 4')).not.toBeInTheDocument();
      expect(screen.queryByText('Source 5')).not.toBeInTheDocument();
    });

    it('shows "more" button when more than 3 sources', () => {
      const activities: ActivityItem[] = [
        createActivity([
          { url: 'https://example1.com', title: 'Source 1', snippet: '' },
          { url: 'https://example2.com', title: 'Source 2', snippet: '' },
          { url: 'https://example3.com', title: 'Source 3', snippet: '' },
          { url: 'https://example4.com', title: 'Source 4', snippet: '' },
        ]),
      ];

      render(<WebSearchStep activities={activities} />);

      expect(screen.getByText('+1')).toBeInTheDocument();
      expect(screen.getByText('more')).toBeInTheDocument();
    });

    it('shows all sources when clicking "more"', () => {
      const activities: ActivityItem[] = [
        createActivity([
          { url: 'https://example1.com', title: 'Source 1', snippet: '' },
          { url: 'https://example2.com', title: 'Source 2', snippet: '' },
          { url: 'https://example3.com', title: 'Source 3', snippet: '' },
          { url: 'https://example4.com', title: 'Source 4', snippet: '' },
          { url: 'https://example5.com', title: 'Source 5', snippet: '' },
        ]),
      ];

      render(<WebSearchStep activities={activities} />);

      fireEvent.click(screen.getByText('more'));

      expect(screen.getByText('Source 4')).toBeInTheDocument();
      expect(screen.getByText('Source 5')).toBeInTheDocument();
      expect(screen.queryByText('more')).not.toBeInTheDocument();
    });

    it('does not show "more" button when 3 or fewer sources', () => {
      const activities: ActivityItem[] = [
        createActivity([
          { url: 'https://example1.com', title: 'Source 1', snippet: '' },
          { url: 'https://example2.com', title: 'Source 2', snippet: '' },
        ]),
      ];

      render(<WebSearchStep activities={activities} />);

      expect(screen.queryByText('more')).not.toBeInTheDocument();
    });
  });

  describe('source chip links', () => {
    it('renders source as link when URL is present', () => {
      const activities: ActivityItem[] = [
        createActivity([
          { url: 'https://example.com/page', title: 'Example Page', snippet: '' },
        ]),
      ];

      render(<WebSearchStep activities={activities} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com/page');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders source without link when no URL', () => {
      const activities: ActivityItem[] = [
        createActivity([
          { url: '', title: 'No Link Source', snippet: 'Some snippet', displayUrl: 'internal' },
        ]),
      ];

      render(<WebSearchStep activities={activities} />);

      expect(screen.getByText('No Link Source')).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('source indices', () => {
    it('displays correct indices for sources', () => {
      const activities: ActivityItem[] = [
        createActivity([
          { url: 'https://a.com', title: 'A', snippet: '' },
          { url: 'https://b.com', title: 'B', snippet: '' },
          { url: 'https://c.com', title: 'C', snippet: '' },
        ]),
      ];

      render(<WebSearchStep activities={activities} />);

      expect(screen.getByText('[1]')).toBeInTheDocument();
      expect(screen.getByText('[2]')).toBeInTheDocument();
      expect(screen.getByText('[3]')).toBeInTheDocument();
    });
  });

  describe('title truncation', () => {
    it('truncates long titles', () => {
      const longTitle =
        'This is a very long title that should be truncated because it exceeds the maximum length';
      const activities: ActivityItem[] = [
        createActivity([{ url: 'https://example.com', title: longTitle, snippet: '' }]),
      ];

      render(<WebSearchStep activities={activities} />);

      // Should be truncated with ellipsis
      expect(screen.getByText(/This is a very long title/)).toBeInTheDocument();
      expect(screen.queryByText(longTitle)).not.toBeInTheDocument();
    });

    it('does not truncate short titles', () => {
      const activities: ActivityItem[] = [
        createActivity([{ url: 'https://example.com', title: 'Short Title', snippet: '' }]),
      ];

      render(<WebSearchStep activities={activities} />);

      expect(screen.getByText('Short Title')).toBeInTheDocument();
    });
  });

  describe('multiple activities', () => {
    it('combines sources from multiple activities', () => {
      const activities: ActivityItem[] = [
        createActivity([{ url: 'https://a.com', title: 'Source A', snippet: '' }]),
        createActivity([{ url: 'https://b.com', title: 'Source B', snippet: '' }]),
      ];

      render(<WebSearchStep activities={activities} />);

      expect(screen.getByText('Source A')).toBeInTheDocument();
      expect(screen.getByText('Source B')).toBeInTheDocument();
    });
  });

  describe('hostname extraction', () => {
    it('uses hostname for display when no title', () => {
      const activities: ActivityItem[] = [
        createActivity([{ url: 'https://www.example.com/path/to/page', title: '', snippet: '' }]),
      ];

      render(<WebSearchStep activities={activities} />);

      // Should show hostname without www prefix
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });
  });

  describe('favicon', () => {
    it('renders favicon image for sources with URL', () => {
      const activities: ActivityItem[] = [
        createActivity([{ url: 'https://example.com', title: 'Example', snippet: '' }]),
      ];

      render(<WebSearchStep activities={activities} />);

      const img = document.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img?.src).toContain('google.com/s2/favicons');
      expect(img?.src).toContain('example.com');
    });
  });
});
