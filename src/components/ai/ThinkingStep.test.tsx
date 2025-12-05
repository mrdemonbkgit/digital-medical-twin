import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThinkingStep } from './ThinkingStep';
import type { ActivityItem } from '@/types/ai';

describe('ThinkingStep', () => {
  const createActivity = (
    overrides: Partial<ActivityItem> = {}
  ): ActivityItem => ({
    id: 'thinking-1',
    type: 'thinking',
    title: 'Analyzing data',
    status: 'completed',
    timestamp: new Date().toISOString(),
    ...overrides,
  });

  describe('rendering', () => {
    it('renders activity title', () => {
      const activity = createActivity({ title: 'Processing request' });

      render(<ThinkingStep activity={activity} />);

      expect(screen.getByText('Processing request')).toBeInTheDocument();
    });

    it('renders content when provided', () => {
      const activity = createActivity({
        title: 'Thinking',
        content: 'Considering multiple factors',
      });

      render(<ThinkingStep activity={activity} />);

      expect(screen.getByText('Thinking')).toBeInTheDocument();
      expect(screen.getByText('Considering multiple factors')).toBeInTheDocument();
    });

    it('does not render content paragraph when no content', () => {
      const activity = createActivity({ content: undefined });

      const { container } = render(<ThinkingStep activity={activity} />);

      // Should not have the content paragraph
      expect(container.querySelectorAll('p').length).toBe(0);
    });

    it('renders bullet point indicator', () => {
      const activity = createActivity();

      const { container } = render(<ThinkingStep activity={activity} />);

      // Should have the circular indicator
      const bullet = container.querySelector('.rounded-full');
      expect(bullet).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies correct title styling', () => {
      const activity = createActivity({ title: 'Analysis complete' });

      render(<ThinkingStep activity={activity} />);

      const title = screen.getByText('Analysis complete');
      expect(title).toHaveClass('font-medium', 'text-gray-800');
    });

    it('applies correct content styling', () => {
      const activity = createActivity({ content: 'Details here' });

      render(<ThinkingStep activity={activity} />);

      const content = screen.getByText('Details here');
      expect(content).toHaveClass('text-gray-500');
    });
  });
});
