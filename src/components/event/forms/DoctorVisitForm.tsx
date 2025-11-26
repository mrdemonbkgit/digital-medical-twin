import type { DoctorVisit } from '@/types';
import { Input, TextArea } from '@/components/common';
import { DatePicker } from '@/components/forms';

type DoctorVisitFormData = Omit<DoctorVisit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface DoctorVisitFormProps {
  data: DoctorVisitFormData;
  onChange: (data: DoctorVisitFormData) => void;
  errors?: Record<string, string>;
}

export function DoctorVisitForm({ data, onChange, errors }: DoctorVisitFormProps) {
  const handleChange = <K extends keyof DoctorVisitFormData>(
    field: K,
    value: DoctorVisitFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const handleDiagnosisChange = (value: string) => {
    // Split by comma and trim whitespace
    const diagnoses = value
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
    handleChange('diagnosis', diagnoses.length > 0 ? diagnoses : undefined);
  };

  return (
    <div className="space-y-4">
      <Input
        label="Title"
        placeholder="e.g., Annual Physical, Follow-up Visit"
        value={data.title}
        onChange={(e) => handleChange('title', e.target.value)}
        error={errors?.title}
        required
      />

      <DatePicker
        label="Date"
        value={data.date}
        onChange={(e) => handleChange('date', e.target.value)}
        error={errors?.date}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Doctor Name"
          placeholder="e.g., Dr. Smith"
          value={data.doctorName}
          onChange={(e) => handleChange('doctorName', e.target.value)}
          error={errors?.doctorName}
          required
        />
        <Input
          label="Specialty (optional)"
          placeholder="e.g., Cardiology, Primary Care"
          value={data.specialty || ''}
          onChange={(e) => handleChange('specialty', e.target.value || undefined)}
        />
      </div>

      <Input
        label="Facility (optional)"
        placeholder="e.g., City Medical Center"
        value={data.facility || ''}
        onChange={(e) => handleChange('facility', e.target.value || undefined)}
      />

      <Input
        label="Diagnosis (optional)"
        placeholder="Comma-separated list, e.g., Type 2 Diabetes, Hypertension"
        value={data.diagnosis?.join(', ') || ''}
        onChange={(e) => handleDiagnosisChange(e.target.value)}
      />

      <Input
        label="Follow-up (optional)"
        placeholder="e.g., Return in 3 months, Labs before next visit"
        value={data.followUp || ''}
        onChange={(e) => handleChange('followUp', e.target.value || undefined)}
      />

      <TextArea
        label="Notes (optional)"
        placeholder="Summary of the visit, recommendations, etc."
        value={data.notes || ''}
        onChange={(e) => handleChange('notes', e.target.value)}
        rows={4}
      />
    </div>
  );
}

export function createEmptyDoctorVisit(): DoctorVisitFormData {
  return {
    type: 'doctor_visit',
    date: new Date().toISOString().split('T')[0],
    title: '',
    doctorName: '',
    specialty: undefined,
    facility: undefined,
    diagnosis: undefined,
    followUp: undefined,
    notes: '',
  };
}
