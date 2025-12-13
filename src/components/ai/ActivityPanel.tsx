import { useState, useMemo } from 'react';
import { ChevronRight, Wrench, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ActivityItem, ToolCall } from '@/types/ai';
import { ActivityTimeline } from './ActivityTimeline';

interface ActivityPanelProps {
  activities: ActivityItem[];
  elapsedTime?: string;
  defaultExpanded?: boolean;
}

// Generate a brief summary from tool call results
function generateToolSummary(activities: ActivityItem[]): string | null {
  const toolCalls = activities.filter((a) => a.type === 'tool_call');
  if (toolCalls.length === 0) return null;

  // Try to extract meaningful summaries from tool results
  const summaries: string[] = [];

  for (const activity of toolCalls) {
    const toolCall = activity.toolCall as ToolCall | undefined;
    if (!toolCall?.result) continue;

    // Look for common patterns in tool results
    const result = toolCall.result.toLowerCase();

    // Count patterns like "found X events/results/items"
    const countMatch = result.match(/found\s+(\d+)\s+\w+/i);
    if (countMatch) {
      summaries.push(countMatch[0]);
      continue;
    }

    // Check for "no results" type messages
    if (result.includes('no ') && (result.includes('found') || result.includes('results'))) {
      summaries.push('no results');
    }
  }

  if (summaries.length > 0) {
    // Return first 2 summaries
    return summaries.slice(0, 2).join(' · ');
  }

  return null;
}

export function ActivityPanel({
  activities,
  elapsedTime,
  defaultExpanded = false,
}: ActivityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Generate summary statistics
  const summary = useMemo(() => {
    const toolCallCount = activities.filter((a) => a.type === 'tool_call').length;
    const thinkingCount = activities.filter((a) => a.type === 'thinking').length;
    const webSearchCount = activities.filter((a) => a.type === 'web_search').length;
    const toolSummary = generateToolSummary(activities);

    return {
      toolCallCount,
      thinkingCount,
      webSearchCount,
      toolSummary,
    };
  }, [activities]);

  if (activities.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-theme-tertiary hover:text-theme-secondary transition-colors w-full"
      >
        <ChevronRight
          className={cn(
            'h-4 w-4 transition-transform duration-200 flex-shrink-0',
            isExpanded && 'rotate-90'
          )}
        />

        {/* Summary content */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Tool count badge */}
          {summary.toolCallCount > 0 && (
            <span className="inline-flex items-center gap-1 text-theme-secondary">
              <Wrench className="h-3.5 w-3.5" />
              <span>{summary.toolCallCount} tool{summary.toolCallCount !== 1 ? 's' : ''} used</span>
            </span>
          )}

          {/* Tool summary (e.g., "found 12 events") */}
          {summary.toolSummary && (
            <>
              <span className="text-theme-muted">·</span>
              <span className="text-theme-muted truncate">{summary.toolSummary}</span>
            </>
          )}

          {/* Elapsed time */}
          {elapsedTime && (
            <>
              <span className="text-theme-muted">·</span>
              <span className="inline-flex items-center gap-1 text-theme-muted">
                <Clock className="h-3.5 w-3.5" />
                <span>{elapsedTime}</span>
              </span>
            </>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 ml-2 border-l-2 border-theme-primary pl-4 space-y-4">
          <ActivityTimeline activities={activities} />
        </div>
      )}
    </div>
  );
}
