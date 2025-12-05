import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestedQuestions } from './SuggestedQuestions';

describe('SuggestedQuestions', () => {
  describe('rendering', () => {
    it('renders "Try asking:" label', () => {
      render(<SuggestedQuestions onSelect={vi.fn()} />);

      expect(screen.getByText('Try asking:')).toBeInTheDocument();
    });

    it('renders all suggested questions', () => {
      render(<SuggestedQuestions onSelect={vi.fn()} />);

      expect(screen.getByText('What were my most recent lab results?')).toBeInTheDocument();
      expect(screen.getByText('How has my blood pressure changed over time?')).toBeInTheDocument();
      expect(screen.getByText('What medications am I currently taking?')).toBeInTheDocument();
      expect(screen.getByText('Summarize my health history from the past year')).toBeInTheDocument();
      expect(screen.getByText('Have I had any abnormal lab values recently?')).toBeInTheDocument();
      expect(screen.getByText('When was my last doctor visit?')).toBeInTheDocument();
    });

    it('renders questions as buttons', () => {
      render(<SuggestedQuestions onSelect={vi.fn()} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(6);
    });
  });

  describe('interaction', () => {
    it('calls onSelect with question when clicked', () => {
      const onSelect = vi.fn();
      render(<SuggestedQuestions onSelect={onSelect} />);

      fireEvent.click(screen.getByText('What were my most recent lab results?'));

      expect(onSelect).toHaveBeenCalledWith('What were my most recent lab results?');
    });

    it('calls onSelect with correct question for each button', () => {
      const onSelect = vi.fn();
      render(<SuggestedQuestions onSelect={onSelect} />);

      fireEvent.click(screen.getByText('What medications am I currently taking?'));

      expect(onSelect).toHaveBeenCalledWith('What medications am I currently taking?');
    });

    it('can click multiple questions', () => {
      const onSelect = vi.fn();
      render(<SuggestedQuestions onSelect={onSelect} />);

      fireEvent.click(screen.getByText('When was my last doctor visit?'));
      fireEvent.click(screen.getByText('How has my blood pressure changed over time?'));

      expect(onSelect).toHaveBeenCalledTimes(2);
      expect(onSelect).toHaveBeenNthCalledWith(1, 'When was my last doctor visit?');
      expect(onSelect).toHaveBeenNthCalledWith(
        2,
        'How has my blood pressure changed over time?'
      );
    });
  });

  describe('styling', () => {
    it('renders buttons with rounded-full class', () => {
      render(<SuggestedQuestions onSelect={vi.fn()} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('rounded-full');
      });
    });

    it('renders buttons with minimum touch target size', () => {
      render(<SuggestedQuestions onSelect={vi.fn()} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('min-h-[44px]');
      });
    });
  });

  describe('accessibility', () => {
    it('renders sparkles icon for visual indication', () => {
      const { container } = render(<SuggestedQuestions onSelect={vi.fn()} />);

      // Lucide icons render as SVG
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });
});
