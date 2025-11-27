import type { ActivityItem } from '@/types/ai';

interface ThinkingStepProps {
  activity: ActivityItem;
}

export function ThinkingStep({ activity }: ThinkingStepProps) {
  return (
    <div className="flex gap-2">
      <div className="mt-1.5 h-2 w-2 rounded-full bg-gray-400 flex-shrink-0" />
      <div className="text-sm text-gray-600">
        <span className="font-medium text-gray-800">{activity.title}</span>
        {activity.content && (
          <p className="mt-1 text-gray-500">{activity.content}</p>
        )}
      </div>
    </div>
  );
}
