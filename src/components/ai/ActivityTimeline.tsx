import type { ActivityItem } from '@/types/ai';
import { ThinkingStep } from './ThinkingStep';
import { ToolCallStep } from './ToolCallStep';
import { WebSearchStep } from './WebSearchStep';

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const thinkingActivities = activities.filter(a => a.type === 'thinking');
  const toolCallActivities = activities.filter(a => a.type === 'tool_call');
  const webSearchActivities = activities.filter(a => a.type === 'web_search');

  return (
    <div className="space-y-4">
      {/* Thinking section */}
      {thinkingActivities.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-theme-secondary mb-2">Thinking</h4>
          <div className="space-y-2">
            {thinkingActivities.map(activity => (
              <ThinkingStep key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      )}

      {/* Tool calls section */}
      {toolCallActivities.length > 0 && (
        <div className="space-y-3">
          {toolCallActivities.map(activity => (
            activity.toolCall && (
              <ToolCallStep key={activity.id} toolCall={activity.toolCall} />
            )
          ))}
        </div>
      )}

      {/* Web search section */}
      {webSearchActivities.length > 0 && (
        <WebSearchStep activities={webSearchActivities} />
      )}
    </div>
  );
}
