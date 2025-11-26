import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Button, Card, CardContent, LoadingSpinner } from '@/components/common';
import {
  getEventTypeInfo,
  MetricForm,
  DoctorVisitForm,
  InterventionForm,
  MedicationForm,
  LabResultForm,
  createEmptyMetric,
  createEmptyDoctorVisit,
  createEmptyIntervention,
  createEmptyMedication,
  createEmptyLabResult,
} from '@/components/event';
import { useEventMutation } from '@/hooks';
import type {
  EventType,
  CreateEventInput,
  CreateMetricInput,
  CreateDoctorVisitInput,
  CreateInterventionInput,
  CreateMedicationInput,
  CreateLabResultInput,
} from '@/types';

function getInitialFormData(type: EventType): CreateEventInput {
  switch (type) {
    case 'metric':
      return createEmptyMetric();
    case 'doctor_visit':
      return createEmptyDoctorVisit();
    case 'intervention':
      return createEmptyIntervention();
    case 'medication':
      return createEmptyMedication();
    case 'lab_result':
      return createEmptyLabResult();
    default:
      throw new Error(`Unknown event type: ${type}`);
  }
}

function validateForm(data: CreateEventInput): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.title?.trim()) {
    errors.title = 'Title is required';
  }

  if (!data.date) {
    errors.date = 'Date is required';
  }

  if (data.type === 'metric') {
    const metric = data as CreateMetricInput;
    if (!metric.metricName?.trim()) {
      errors.metricName = 'Metric name is required';
    }
    if (!metric.unit?.trim()) {
      errors.unit = 'Unit is required';
    }
  } else if (data.type === 'doctor_visit') {
    const visit = data as CreateDoctorVisitInput;
    if (!visit.doctorName?.trim()) {
      errors.doctorName = 'Doctor name is required';
    }
  } else if (data.type === 'intervention') {
    const intervention = data as CreateInterventionInput;
    if (!intervention.interventionName?.trim()) {
      errors.interventionName = 'Intervention name is required';
    }
    if (!intervention.startDate) {
      errors.startDate = 'Start date is required';
    }
  } else if (data.type === 'medication') {
    const medication = data as CreateMedicationInput;
    if (!medication.medicationName?.trim()) {
      errors.medicationName = 'Medication name is required';
    }
    if (!medication.dosage?.trim()) {
      errors.dosage = 'Dosage is required';
    }
    if (!medication.frequency?.trim()) {
      errors.frequency = 'Frequency is required';
    }
    if (!medication.startDate) {
      errors.startDate = 'Start date is required';
    }
  } else if (data.type === 'lab_result') {
    const lab = data as CreateLabResultInput;
    if (!lab.biomarkers || lab.biomarkers.length === 0) {
      errors.biomarkers = 'At least one biomarker is required';
    }
  }

  return errors;
}

export function EventNewPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { create, isCreating, error: mutationError } = useEventMutation();

  const eventType = type as EventType;
  const typeInfo = getEventTypeInfo(eventType);
  const Icon = typeInfo.icon;

  const [formData, setFormData] = useState<CreateEventInput>(
    getInitialFormData(eventType)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await create(formData);
      navigate('/timeline');
    } catch {
      // Error is handled by the hook
    }
  };

  const renderForm = () => {
    switch (eventType) {
      case 'metric':
        return (
          <MetricForm
            data={formData as CreateMetricInput}
            onChange={(data) => setFormData(data)}
            errors={errors}
          />
        );
      case 'doctor_visit':
        return (
          <DoctorVisitForm
            data={formData as CreateDoctorVisitInput}
            onChange={(data) => setFormData(data)}
            errors={errors}
          />
        );
      case 'intervention':
        return (
          <InterventionForm
            data={formData as CreateInterventionInput}
            onChange={(data) => setFormData(data)}
            errors={errors}
          />
        );
      case 'medication':
        return (
          <MedicationForm
            data={formData as CreateMedicationInput}
            onChange={(data) => setFormData(data)}
            errors={errors}
          />
        );
      case 'lab_result':
        return (
          <LabResultForm
            data={formData as CreateLabResultInput}
            onChange={(data) => setFormData(data)}
            errors={errors}
          />
        );
      default:
        return <p>Unknown event type</p>;
    }
  };

  return (
    <PageWrapper
      title={`New ${typeInfo.label}`}
      action={
        <Link to="/event/new">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Change Type
          </Button>
        </Link>
      }
    >
      <div className="max-w-2xl mx-auto">
        <Card>
          <div
            className={`px-6 py-4 border-b flex items-center gap-3 ${typeInfo.colors.bg}`}
          >
            <Icon className={`w-5 h-5 ${typeInfo.colors.icon}`} />
            <span className="font-medium text-gray-900">{typeInfo.label}</span>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {renderForm()}

              {mutationError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{mutationError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Link to="/timeline">
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Event
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
