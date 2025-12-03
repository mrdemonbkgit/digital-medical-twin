import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Button, Card, CardContent, LoadingSpinner } from '@/components/common';
import {
  getEventTypeInfo,
  MetricForm,
  DoctorVisitForm,
  InterventionForm,
  MedicationForm,
  LabResultForm,
  ViceForm,
} from '@/components/event';
import { useEvent, useEventMutation } from '@/hooks';
import type {
  CreateEventInput,
  UpdateEventInput,
  CreateMetricInput,
  CreateDoctorVisitInput,
  CreateInterventionInput,
  CreateMedicationInput,
  CreateLabResultInput,
  CreateViceInput,
} from '@/types';

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
  } else if (data.type === 'vice') {
    const vice = data as CreateViceInput;
    if (!vice.viceCategory) {
      errors.viceCategory = 'Category is required';
    }
  }

  return errors;
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { event, isLoading: isLoadingEvent, error: loadError } = useEvent(id);
  const {
    update,
    remove,
    isUpdating,
    isDeleting,
    error: mutationError,
  } = useEventMutation();

  const [formData, setFormData] = useState<CreateEventInput | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when event loads
  useEffect(() => {
    if (event) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = event;
      setFormData(rest as CreateEventInput);
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData || !id) return;

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await update(id, formData as UpdateEventInput);
      navigate('/timeline');
    } catch {
      // Error is handled by the hook
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await remove(id);
      navigate('/timeline');
    } catch {
      // Error is handled by the hook
    }
  };

  if (isLoadingEvent) {
    return (
      <PageWrapper title="Loading...">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  if (loadError || !event) {
    return (
      <PageWrapper title="Error">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{loadError || 'Event not found'}</p>
          <Link to="/timeline">
            <Button variant="secondary">Back to Timeline</Button>
          </Link>
        </div>
      </PageWrapper>
    );
  }

  if (!formData) {
    return null;
  }

  const typeInfo = getEventTypeInfo(event.type);
  const Icon = typeInfo.icon;

  const renderForm = () => {
    switch (event.type) {
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
      case 'vice':
        return (
          <ViceForm
            data={formData as CreateViceInput}
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
      title={`Edit ${typeInfo.label}`}
      action={
        <Link to="/timeline">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Timeline
          </Button>
        </Link>
      }
    >
      <div className="max-w-2xl mx-auto">
        <Card>
          <div
            className={`px-6 py-4 border-b flex items-center justify-between ${typeInfo.colors.bg}`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${typeInfo.colors.icon}`} />
              <span className="font-medium text-gray-900">{typeInfo.label}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isDeleting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </>
              )}
            </Button>
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
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
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
