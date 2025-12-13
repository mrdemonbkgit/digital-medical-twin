import { Loader2, Check, XCircle, Square } from 'lucide-react';
import type { StreamingStatus, CompletedTool } from '@/hooks/useAIChat';
import { getToolLabel } from '@/constants';

interface StreamingIndicatorProps {
  status: StreamingStatus;
  onStop?: () => void;
}

// Format completed tool with result summary
function formatCompletedTool(tool: CompletedTool): string {
  const label = getToolLabel(tool.name);
  if (tool.resultSummary) {
    return `${label} (${tool.resultSummary})`;
  }
  return label;
}

export function StreamingIndicator({ status, onStop }: StreamingIndicatorProps) {
  if (!status.active) {
    return null;
  }

  const hasCompletedTools = status.completedTools.length > 0;
  const totalSteps = status.toolCallCount;
  const completedSteps = status.completedTools.length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="bg-theme-secondary rounded-lg border border-theme-primary overflow-hidden">
      {/* Step list */}
      <div className="px-4 py-3 space-y-2">
        {/* Completed tools */}
        {status.completedTools.map((tool) => (
          <div key={tool.id} className="flex items-center gap-2 text-sm">
            {tool.status === 'completed' ? (
              <Check className="h-4 w-4 text-success flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-danger flex-shrink-0" />
            )}
            <span className="text-theme-secondary">{formatCompletedTool(tool)}</span>
          </div>
        ))}

        {/* Current tool */}
        {status.currentTool && (
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-accent flex-shrink-0" />
            <span className="text-theme-primary font-medium">
              {getToolLabel(status.currentTool)}...
            </span>
          </div>
        )}

        {/* Initial "Analyzing..." state when no tools yet */}
        {!hasCompletedTools && !status.currentTool && (
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-accent flex-shrink-0" />
            <span className="text-theme-primary font-medium">Analyzing your question...</span>
          </div>
        )}
      </div>

      {/* Progress bar and stop button */}
      {(totalSteps > 0 || onStop) && (
        <div className="flex items-center gap-3 px-4 py-2 bg-theme-tertiary border-t border-theme-primary">
          {/* Progress bar */}
          {totalSteps > 0 && (
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-theme-primary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-theme-muted whitespace-nowrap">
                {completedSteps}/{totalSteps} steps
              </span>
            </div>
          )}

          {/* Stop button */}
          {onStop && (
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-danger bg-danger-muted rounded-md hover:opacity-80 transition-opacity"
            >
              <Square className="h-3 w-3 fill-current" />
              Stop
            </button>
          )}
        </div>
      )}
    </div>
  );
}
