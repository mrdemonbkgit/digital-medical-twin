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
    activeClasses: 'bg-red-100 text-red-700 border-red-300',
    inactiveClasses: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
  },
  {
    type: 'doctor_visit',
    label: 'Visits',
    icon: Stethoscope,
    activeClasses: 'bg-blue-100 text-blue-700 border-blue-300',
    inactiveClasses: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
  },
  {
    type: 'medication',
    label: 'Meds',
    icon: Pill,
    activeClasses: 'bg-green-100 text-green-700 border-green-300',
    inactiveClasses: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
  },
  {
    type: 'intervention',
    label: 'Interventions',
    icon: Zap,
    activeClasses: 'bg-amber-100 text-amber-700 border-amber-300',
    inactiveClasses: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
  },
  {
    type: 'metric',
    label: 'Metrics',
    icon: Activity,
    activeClasses: 'bg-purple-100 text-purple-700 border-purple-300',
    inactiveClasses: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
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
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Clear type filters"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
