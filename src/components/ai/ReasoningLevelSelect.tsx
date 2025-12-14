import { Brain } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { AIProvider, OpenAIReasoningEffort, GeminiThinkingLevel } from '@/types/ai';
import {
  OPENAI_REASONING_EFFORT_OPTIONS,
  GEMINI_THINKING_LEVEL_OPTIONS,
} from '@/types/ai';

interface ReasoningLevelSelectProps {
  provider: AIProvider;
  openaiReasoningEffort: OpenAIReasoningEffort;
  geminiThinkingLevel: GeminiThinkingLevel;
  onChangeOpenAI: (value: OpenAIReasoningEffort) => void;
  onChangeGemini: (value: GeminiThinkingLevel) => void;
  disabled?: boolean;
}

export function ReasoningLevelSelect({
  provider,
  openaiReasoningEffort,
  geminiThinkingLevel,
  onChangeOpenAI,
  onChangeGemini,
  disabled = false,
}: ReasoningLevelSelectProps) {
  const isOpenAI = provider === 'openai';
  const options = isOpenAI ? OPENAI_REASONING_EFFORT_OPTIONS : GEMINI_THINKING_LEVEL_OPTIONS;
  const currentValue = isOpenAI ? openaiReasoningEffort : geminiThinkingLevel;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isOpenAI) {
      onChangeOpenAI(e.target.value as OpenAIReasoningEffort);
    } else {
      onChangeGemini(e.target.value as GeminiThinkingLevel);
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <Brain className="h-4 w-4 text-theme-muted hidden sm:block" />
      <select
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          'text-xs sm:text-sm bg-theme-secondary border border-theme-primary rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1',
          'focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent',
          'cursor-pointer hover:bg-theme-tertiary transition-colors',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title={isOpenAI ? 'Reasoning Effort' : 'Thinking Level'}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
