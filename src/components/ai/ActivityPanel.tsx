import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ActivityItem } from '@/types/ai';
import { ActivityTimeline } from './ActivityTimeline';

interface ActivityPanelProps {
  activities: ActivityItem[];
  elapsedTime?: string;
  defaultExpanded?: boolean;
}

export function ActivityPanel({
  activities,
  elapsedTime,
  defaultExpanded = false,
}: ActivityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (activities.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ChevronRight
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isExpanded && 'rotate-90'
          )}
        />
        <span className="font-medium">Activity</span>
        {elapsedTime && (
          <span className="text-gray-400">· {elapsedTime}</span>
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 ml-2 border-l-2 border-gray-200 pl-4 space-y-4">
          <ActivityTimeline activities={activities} />
        </div>
      )}
    </div>
  );
}
