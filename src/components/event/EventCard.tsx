import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Calendar,
  FlaskConical,
  Stethoscope,
  Pill,
  Sparkles,
  Activity,
} from 'lucide-react';
import type {
  HealthEvent,
  LabResult,
  DoctorVisit,
  Medication,
  Intervention,
  Metric,
} from '@/types';
import { cn, highlightText } from '@/utils';
import { Button } from '@/components/common';

interface EventCardProps {
  event: HealthEvent;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  searchQuery?: string;
}

const typeConfig = {
  lab_result: {
    icon: FlaskConical,
    bg: 'bg-red-50',
    border: 'border-l-red-500',
    iconColor: 'text-red-600',
    label: 'Lab Result',
  },
  doctor_visit: {
    icon: Stethoscope,
    bg: 'bg-blue-50',
    border: 'border-l-blue-500',
    iconColor: 'text-blue-600',
    label: 'Doctor Visit',
  },
  medication: {
    icon: Pill,
    bg: 'bg-green-50',
    border: 'border-l-green-500',
    iconColor: 'text-green-600',
    label: 'Medication',
  },
  intervention: {
    icon: Sparkles,
    bg: 'bg-amber-50',
    border: 'border-l-amber-500',
    iconColor: 'text-amber-600',
    label: 'Intervention',
  },
  metric: {
    icon: Activity,
    bg: 'bg-purple-50',
    border: 'border-l-purple-500',
    iconColor: 'text-purple-600',
    label: 'Metric',
  },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function LabResultDetails({ event }: { event: LabResult }) {
  return (
    <div className="space-y-3">
      {event.labName && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">Lab:</span> {event.labName}
        </p>
      )}
      {event.orderingDoctor && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">Ordered by:</span> {event.orderingDoctor}
        </p>
      )}
      {event.biomarkers.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Biomarkers:</p>
          <div className="space-y-1">
            {event.biomarkers.map((biomarker, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm bg-white p-2 rounded"
              >
                <span className="text-gray-700">{biomarker.name}</span>
                <span
                  className={cn(
                    'font-medium',
                    biomarker.flag === 'high' && 'text-red-600',
                    biomarker.flag === 'low' && 'text-blue-600',
                    biomarker.flag === 'normal' && 'text-green-600'
                  )}
                >
                  {biomarker.value} {biomarker.unit}
                  {biomarker.flag && biomarker.flag !== 'normal' && (
                    <span className="ml-1 text-xs uppercase">({biomarker.flag})</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DoctorVisitDetails({ event }: { event: DoctorVisit }) {
  return (
    <div className="space-y-2 text-sm text-gray-600">
      <p>
        <span className="font-medium">Doctor:</span> {event.doctorName}
      </p>
      {event.specialty && (
        <p>
          <span className="font-medium">Specialty:</span> {event.specialty}
        </p>
      )}
      {event.facility && (
        <p>
          <span className="font-medium">Facility:</span> {event.facility}
        </p>
      )}
      {event.diagnosis && event.diagnosis.length > 0 && (
        <p>
          <span className="font-medium">Diagnosis:</span> {event.diagnosis.join(', ')}
        </p>
      )}
      {event.followUp && (
        <p>
          <span className="font-medium">Follow-up:</span> {event.followUp}
        </p>
      )}
    </div>
  );
}

function MedicationDetails({ event }: { event: Medication }) {
  return (
    <div className="space-y-2 text-sm text-gray-600">
      <p>
        <span className="font-medium">Medication:</span> {event.medicationName}
      </p>
      <p>
        <span className="font-medium">Dosage:</span> {event.dosage}
      </p>
      <p>
        <span className="font-medium">Frequency:</span> {event.frequency}
      </p>
      {event.prescriber && (
        <p>
          <span className="font-medium">Prescriber:</span> {event.prescriber}
        </p>
      )}
      {event.reason && (
        <p>
          <span className="font-medium">Reason:</span> {event.reason}
        </p>
      )}
      <p>
        <span className="font-medium">Started:</span> {formatDate(event.startDate)}
        {event.endDate && ` — Ended: ${formatDate(event.endDate)}`}
      </p>
      <p>
        <span className="font-medium">Status:</span>{' '}
        <span className={event.isActive ? 'text-green-600' : 'text-gray-500'}>
          {event.isActive ? 'Currently taking' : 'Discontinued'}
        </span>
      </p>
    </div>
  );
}

function InterventionDetails({ event }: { event: Intervention }) {
  return (
    <div className="space-y-2 text-sm text-gray-600">
      <p>
        <span className="font-medium">Intervention:</span> {event.interventionName}
      </p>
      <p>
        <span className="font-medium">Category:</span>{' '}
        <span className="capitalize">{event.category}</span>
      </p>
      <p>
        <span className="font-medium">Started:</span> {formatDate(event.startDate)}
        {event.endDate && ` — Ended: ${formatDate(event.endDate)}`}
      </p>
      {event.protocol && (
        <p>
          <span className="font-medium">Protocol:</span> {event.protocol}
        </p>
      )}
      <p>
        <span className="font-medium">Status:</span>{' '}
        <span className={event.isOngoing ? 'text-green-600' : 'text-gray-500'}>
          {event.isOngoing ? 'Ongoing' : 'Completed'}
        </span>
      </p>
    </div>
  );
}

function MetricDetails({ event }: { event: Metric }) {
  return (
    <div className="space-y-2 text-sm text-gray-600">
      <p>
        <span className="font-medium">Metric:</span> {event.metricName}
      </p>
      <p>
        <span className="font-medium">Value:</span> {event.value} {event.unit}
      </p>
      <p>
        <span className="font-medium">Source:</span>{' '}
        <span className="capitalize">{event.source.replace('_', ' ')}</span>
      </p>
    </div>
  );
}

function EventDetails({ event }: { event: HealthEvent }) {
  switch (event.type) {
    case 'lab_result':
      return <LabResultDetails event={event} />;
    case 'doctor_visit':
      return <DoctorVisitDetails event={event} />;
    case 'medication':
      return <MedicationDetails event={event} />;
    case 'intervention':
      return <InterventionDetails event={event} />;
    case 'metric':
      return <MetricDetails event={event} />;
    default:
      return null;
  }
}

export function EventCard({ event, onDelete, isDeleting, searchQuery }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const config = typeConfig[event.type];
  const Icon = config.icon;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/event/${event.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 border-l-4 overflow-hidden transition-all',
        config.border
      )}
    >
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left',
          config.bg
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', config.bg)}>
            <Icon className={cn('w-5 h-5', config.iconColor)} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {searchQuery ? highlightText(event.title, searchQuery) : event.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(event.date)}</span>
              <span className="text-gray-300">•</span>
              <span>{config.label}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="p-1.5"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className={cn('p-4 border-t border-gray-200', config.bg)}>
          <EventDetails event={event} />
          {event.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {searchQuery ? highlightText(event.notes, searchQuery) : event.notes}
              </p>
            </div>
          )}
          {event.tags && event.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {event.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs bg-white rounded-full text-gray-600 border border-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
