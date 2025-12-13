import {
  FlaskConical,
  Stethoscope,
  Pill,
  Zap,
  Activity,
  X,
} from 'lucide-react';
import type { EventType } from '@/types';
import { cn } from '@/utils';

interface EventTypeConfig {
  type: EventType;
  label: string;
  icon: typeof FlaskConical;
  activeClasses: string;
  inactiveClasses: string;
}

const eventTypeConfigs: EventTypeConfig[] = [
  {
    type: 'lab_result',
    label: 'Labs',
    icon: FlaskConical,
    activeClasses: 'bg-event-lab text-event-lab border-event-lab',
    inactiveClasses: 'bg-theme-secondary text-theme-secondary border-theme-primary hover:bg-theme-tertiary',
  },
  {
    type: 'doctor_visit',
    label: 'Visits',
    icon: Stethoscope,
    activeClasses: 'bg-info-muted text-info border-info',
    inactiveClasses: 'bg-theme-secondary text-theme-secondary border-theme-primary hover:bg-theme-tertiary',
  },
  {
    type: 'medication',
    label: 'Meds',
    icon: Pill,
    activeClasses: 'bg-success-muted text-success border-success',
    inactiveClasses: 'bg-theme-secondary text-theme-secondary border-theme-primary hover:bg-theme-tertiary',
  },
  {
    type: 'intervention',
    label: 'Interventions',
    icon: Zap,
    activeClasses: 'bg-warning-muted text-warning border-warning',
    inactiveClasses: 'bg-theme-secondary text-theme-secondary border-theme-primary hover:bg-theme-tertiary',
  },
  {
    type: 'metric',
    label: 'Metrics',
    icon: Activity,
    activeClasses: 'bg-event-metric text-event-metric border-event-metric',
    inactiveClasses: 'bg-theme-secondary text-theme-secondary border-theme-primary hover:bg-theme-tertiary',
  },
];

interface EventTypeFilterChipsProps {
  selectedTypes: EventType[];
  onToggle: (type: EventType) => void;
  onClear: () => void;
  className?: string;
}

/**
 * Inline filter chips for event types.
 * Multi-select toggle behavior with colored active states.
 */
export function EventTypeFilterChips({
  selectedTypes,
  onToggle,
  onClear,
  className,
}: EventTypeFilterChipsProps) {
  const hasSelection = selectedTypes.length > 0;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {eventTypeConfigs.map(({ type, label, icon: Icon, activeClasses, inactiveClasses }) => {
        const isSelected = selectedTypes.includes(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              isSelected ? activeClasses : inactiveClasses
            )}
            aria-pressed={isSelected}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}

      {hasSelection && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-full border border-theme-primary bg-theme-secondary px-2.5 py-1.5 text-xs font-medium text-theme-tertiary transition-colors hover:bg-theme-tertiary hover:text-theme-secondary"
          aria-label="Clear type filters"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
