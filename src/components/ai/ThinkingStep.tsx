import type { ActivityItem } from '@/types/ai';

interface ThinkingStepProps {
  activity: ActivityItem;
}

export function ThinkingStep({ activity }: ThinkingStepProps) {
  return (
    <div className="flex gap-2">
      <div className="mt-1.5 h-2 w-2 rounded-full bg-theme-muted flex-shrink-0" />
      <div className="text-sm text-theme-secondary">
        <span className="font-medium text-theme-primary">{activity.title}</span>
        {activity.content && (
          <p className="mt-1 text-theme-tertiary">{activity.content}</p>
        )}
      </div>
    </div>
  );
}
