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
      bg: 'bg-red-50',
      border: 'border-red-200',
      hover: 'hover:border-red-400 hover:bg-red-100',
      icon: 'text-red-600',
    },
  },
  {
    type: 'doctor_visit',
    label: 'Doctor Visit',
    description: 'Appointments, consultations, and check-ups',
    icon: Stethoscope,
    colors: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      hover: 'hover:border-blue-400 hover:bg-blue-100',
      icon: 'text-blue-600',
    },
  },
  {
    type: 'medication',
    label: 'Medication',
    description: 'Prescriptions, supplements, and treatments',
    icon: Pill,
    colors: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      hover: 'hover:border-green-400 hover:bg-green-100',
      icon: 'text-green-600',
    },
  },
  {
    type: 'intervention',
    label: 'Intervention',
    description: 'Lifestyle changes, diet, exercise, and protocols',
    icon: Sparkles,
    colors: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      hover: 'hover:border-amber-400 hover:bg-amber-100',
      icon: 'text-amber-600',
    },
  },
  {
    type: 'metric',
    label: 'Metric',
    description: 'Health measurements from devices or manual entry',
    icon: Activity,
    colors: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      hover: 'hover:border-purple-400 hover:bg-purple-100',
      icon: 'text-purple-600',
    },
  },
  {
    type: 'vice',
    label: 'Vice',
    description: 'Private tracking of alcohol, smoking, and other habits',
    icon: EyeOff,
    colors: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      hover: 'hover:border-slate-400 hover:bg-slate-100',
      icon: 'text-slate-600',
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
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{label}</h3>
          <p className="text-sm text-gray-600">{description}</p>
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
