import { Loader2 } from 'lucide-react';
import type { StreamingStatus } from '@/hooks/useAIChat';

interface StreamingIndicatorProps {
  status: StreamingStatus;
}

// User-friendly labels for each tool
const TOOL_LABELS: Record<string, string> = {
  get_profile: 'Loading your profile...',
  get_medications: 'Checking medications...',
  get_recent_labs: 'Retrieving lab results...',
  get_biomarker_history: 'Analyzing biomarker trends...',
  search_events: 'Searching health timeline...',
  get_event_details: 'Getting event details...',
};

export function StreamingIndicator({ status }: StreamingIndicatorProps) {
  if (!status.active) {
    return null;
  }

  const message = status.currentTool
    ? TOOL_LABELS[status.currentTool] || `Running ${status.currentTool}...`
    : 'Analyzing your question...';

  return (
    <div className="flex items-center gap-3 px-4 py-3 text-sm text-theme-secondary bg-theme-secondary rounded-lg border border-theme-primary">
      <Loader2 className="h-4 w-4 animate-spin text-accent flex-shrink-0" />
      <span>{message}</span>
      {status.toolCallCount > 1 && (
        <span className="text-xs text-theme-muted">
          ({status.toolCallCount} tools used)
        </span>
      )}
    </div>
  );
}
