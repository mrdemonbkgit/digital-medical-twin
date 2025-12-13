import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Stethoscope,
  Pill,
  Sparkles,
  Activity,
  EyeOff,
} from 'lucide-react';
import type { EventType } from '@/types';
import { cn } from '@/utils/cn';

interface EventTypeOption {
  type: EventType;
  label: string;
  description: string;
  icon: typeof FlaskConical;
  colors: {
    bg: string;
    border: string;
    hover: string;
    icon: string;
  };
}

const eventTypes: EventTypeOption[] = [
  {
    type: 'lab_result',
    label: 'Lab Result',
    description: 'Blood tests, biomarkers, and diagnostic results',
    icon: FlaskConical,
    colors: {
      bg: 'bg-event-lab',
      border: 'border-event-lab',
      hover: 'hover:opacity-80',
      icon: 'text-event-lab',
    },
  },
  {
    type: 'doctor_visit',
    label: 'Doctor Visit',
    description: 'Appointments, consultations, and check-ups',
    icon: Stethoscope,
    colors: {
      bg: 'bg-event-visit',
      border: 'border-event-visit',
      hover: 'hover:opacity-80',
      icon: 'text-event-visit',
    },
  },
  {
    type: 'medication',
    label: 'Medication',
    description: 'Prescriptions, supplements, and treatments',
    icon: Pill,
    colors: {
      bg: 'bg-event-medication',
      border: 'border-event-medication',
      hover: 'hover:opacity-80',
      icon: 'text-event-medication',
    },
  },
  {
    type: 'intervention',
    label: 'Intervention',
    description: 'Lifestyle changes, diet, exercise, and protocols',
    icon: Sparkles,
    colors: {
      bg: 'bg-event-intervention',
      border: 'border-event-intervention',
      hover: 'hover:opacity-80',
      icon: 'text-event-intervention',
    },
  },
  {
    type: 'metric',
    label: 'Metric',
    description: 'Health measurements from devices or manual entry',
    icon: Activity,
    colors: {
      bg: 'bg-event-metric',
      border: 'border-event-metric',
      hover: 'hover:opacity-80',
      icon: 'text-event-metric',
    },
  },
  {
    type: 'vice',
    label: 'Vice',
    description: 'Private tracking of alcohol, smoking, and other habits',
    icon: EyeOff,
    colors: {
      bg: 'bg-event-vice',
      border: 'border-event-vice',
      hover: 'hover:opacity-80',
      icon: 'text-event-vice',
    },
  },
];

interface EventTypeSelectorProps {
  onSelect?: (type: EventType) => void;
  navigateOnSelect?: boolean;
}

export function EventTypeSelector({
  onSelect,
  navigateOnSelect = true,
}: EventTypeSelectorProps) {
  const navigate = useNavigate();

  const handleSelect = (type: EventType) => {
    if (onSelect) {
      onSelect(type);
    }
    if (navigateOnSelect) {
      navigate(`/event/new/${type}`);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {eventTypes.map(({ type, label, description, icon: Icon, colors }) => (
        <button
          key={type}
          onClick={() => handleSelect(type)}
          className={cn(
            'flex flex-col items-start p-6 rounded-xl border-2 text-left transition-all',
            colors.bg,
            colors.border,
            colors.hover
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-lg mb-4',
              colors.bg
            )}
          >
            <Icon className={cn('w-6 h-6', colors.icon)} />
          </div>
          <h3 className="text-lg font-semibold text-theme-primary mb-1">{label}</h3>
          <p className="text-sm text-theme-secondary">{description}</p>
        </button>
      ))}
    </div>
  );
}

// Helper to get event type info
export function getEventTypeInfo(type: EventType): EventTypeOption {
  const info = eventTypes.find((et) => et.type === type);
  if (!info) {
    throw new Error(`Unknown event type: ${type}`);
  }
  return info;
}

export { eventTypes };
