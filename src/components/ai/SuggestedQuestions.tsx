import { Sparkles } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const SUGGESTED_QUESTIONS = [
  'What were my most recent lab results?',
  'How has my blood pressure changed over time?',
  'What medications am I currently taking?',
  'Summarize my health history from the past year',
  'Have I had any abnormal lab values recently?',
  'When was my last doctor visit?',
];

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
        <Sparkles className="h-4 w-4" />
        <span>Try asking:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((question) => (
          <button
            key={question}
            onClick={() => onSelect(question)}
            className="px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-600 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors min-h-[44px]"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
