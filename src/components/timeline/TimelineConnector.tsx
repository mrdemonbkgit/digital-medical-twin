import type { ReactNode } from 'react';
import type { EventType } from '@/types';
import { cn } from '@/utils';

// Event type to color mapping for dots
const eventTypeColors: Record<EventType, string> = {
  lab_result: 'bg-event-lab',
  doctor_visit: 'bg-event-visit',
  medication: 'bg-event-medication',
  intervention: 'bg-event-intervention',
  metric: 'bg-event-metric',
  vice: 'bg-event-vice',
};

interface TimelineGroupProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper for a date group in the timeline.
 * Adds the vertical connector line.
 */
export function TimelineGroup({ children, className }: TimelineGroupProps) {
  return (
    <div className={cn('relative pl-6', className)}>
      {/* Vertical connector line */}
      <div
        className="absolute left-[7px] top-8 bottom-0 w-0.5 bg-theme-tertiary"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

interface TimelineEventProps {
  children: ReactNode;
  eventType: EventType;
  isLast?: boolean;
  className?: string;
}

/**
 * Wrapper for individual event in the timeline.
 * Adds the colored dot connector.
 */
export function TimelineEvent({
  children,
  eventType,
  isLast = false,
  className,
}: TimelineEventProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Dot connector */}
      <div
        className={cn(
          'absolute -left-6 top-5 h-3 w-3 rounded-full border-2 border-theme-primary shadow-sm',
          eventTypeColors[eventType]
        )}
        aria-hidden="true"
      />
      {/* Hide the line for the last item */}
      {isLast && (
        <div
          className="absolute -left-[17px] top-6 bottom-0 w-0.5 bg-theme-primary"
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

interface TimelineDateHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * Date header with timeline styling.
 */
export function TimelineDateHeader({ children, className }: TimelineDateHeaderProps) {
  return (
    <div className={cn('relative mb-4', className)}>
      {/* Circle at the header */}
      <div
        className="absolute -left-6 top-0.5 h-3 w-3 rounded-full border-2 border-theme-primary bg-theme-primary"
        aria-hidden="true"
      />
      <h2 className="text-sm font-semibold uppercase tracking-wide text-theme-tertiary">
        {children}
      </h2>
    </div>
  );
}
