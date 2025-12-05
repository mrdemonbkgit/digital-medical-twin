import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReasoningLevelSelect } from './ReasoningLevelSelect';
import type { OpenAIReasoningEffort, GeminiThinkingLevel } from '@/types/ai';

describe('ReasoningLevelSelect', () => {
  const defaultProps = {
    provider: 'openai' as const,
    openaiReasoningEffort: 'medium' as OpenAIReasoningEffort,
    geminiThinkingLevel: 'high' as GeminiThinkingLevel,
    onChangeOpenAI: vi.fn(),
    onChangeGemini: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OpenAI provider', () => {
    it('renders OpenAI reasoning effort options', () => {
      render(<ReasoningLevelSelect {...defaultProps} provider="openai" />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute('title', 'Reasoning Effort');
    });

    it('shows current OpenAI value', () => {
      render(
        <ReasoningLevelSelect {...defaultProps} provider="openai" openaiReasoningEffort="high" />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('high');
    });

    it('renders all OpenAI options', () => {
      render(<ReasoningLevelSelect {...defaultProps} provider="openai" />);

      expect(screen.getByRole('option', { name: /none/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /low/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /medium/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /high/i })).toBeInTheDocument();
    });

    it('calls onChangeOpenAI when value changes', () => {
      const onChangeOpenAI = vi.fn();
      render(<ReasoningLevelSelect {...defaultProps} onChangeOpenAI={onChangeOpenAI} />);

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'high' } });

      expect(onChangeOpenAI).toHaveBeenCalledWith('high');
    });

    it('does not call onChangeGemini when OpenAI changes', () => {
      const onChangeGemini = vi.fn();
      render(<ReasoningLevelSelect {...defaultProps} onChangeGemini={onChangeGemini} />);

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'low' } });

      expect(onChangeGemini).not.toHaveBeenCalled();
    });
  });

  describe('Google/Gemini provider', () => {
    it('renders Gemini thinking level options', () => {
      render(<ReasoningLevelSelect {...defaultProps} provider="google" />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute('title', 'Thinking Level');
    });

    it('shows current Gemini value', () => {
      render(
        <ReasoningLevelSelect {...defaultProps} provider="google" geminiThinkingLevel="low" />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('low');
    });

    it('renders Gemini options', () => {
      render(<ReasoningLevelSelect {...defaultProps} provider="google" />);

      expect(screen.getByRole('option', { name: /low/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /high/i })).toBeInTheDocument();
    });

    it('calls onChangeGemini when value changes', () => {
      const onChangeGemini = vi.fn();
      render(
        <ReasoningLevelSelect {...defaultProps} provider="google" onChangeGemini={onChangeGemini} />
      );

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'low' } });

      expect(onChangeGemini).toHaveBeenCalledWith('low');
    });

    it('does not call onChangeOpenAI when Gemini changes', () => {
      const onChangeOpenAI = vi.fn();
      render(
        <ReasoningLevelSelect {...defaultProps} provider="google" onChangeOpenAI={onChangeOpenAI} />
      );

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'low' } });

      expect(onChangeOpenAI).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('disables select when disabled prop is true', () => {
      render(<ReasoningLevelSelect {...defaultProps} disabled={true} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('enables select by default', () => {
      render(<ReasoningLevelSelect {...defaultProps} />);

      const select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();
    });

    it('applies opacity class when disabled', () => {
      render(<ReasoningLevelSelect {...defaultProps} disabled={true} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('icon', () => {
    it('renders brain icon', () => {
      const { container } = render(<ReasoningLevelSelect {...defaultProps} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });
});
