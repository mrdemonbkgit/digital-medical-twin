import type { LabResult, Biomarker } from '@/types';
import { Input, TextArea } from '@/components/common';
import { DatePicker } from '@/components/forms';
import { BiomarkerInput } from '../BiomarkerInput';

type LabResultFormData = Omit<LabResult, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface LabResultFormProps {
  data: LabResultFormData;
  onChange: (data: LabResultFormData) => void;
  errors?: Record<string, string>;
}

export function LabResultForm({ data, onChange, errors }: LabResultFormProps) {
  const handleChange = <K extends keyof LabResultFormData>(
    field: K,
    value: LabResultFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const handleBiomarkersChange = (biomarkers: Biomarker[]) => {
    handleChange('biomarkers', biomarkers);
  };

  return (
    <div className="space-y-4">
      <Input
        label="Title"
        placeholder="e.g., Comprehensive Metabolic Panel, Lipid Panel"
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
          label="Lab Name (optional)"
          placeholder="e.g., Quest Diagnostics, LabCorp"
          value={data.labName || ''}
          onChange={(e) => handleChange('labName', e.target.value || undefined)}
        />
        <Input
          label="Ordering Doctor (optional)"
          placeholder="e.g., Dr. Smith"
          value={data.orderingDoctor || ''}
          onChange={(e) => handleChange('orderingDoctor', e.target.value || undefined)}
        />
      </div>

      <div className="border-t border-gray-200 pt-4">
        <BiomarkerInput
          biomarkers={data.biomarkers}
          onChange={handleBiomarkersChange}
          error={errors?.biomarkers}
        />
      </div>

      <TextArea
        label="Notes (optional)"
        placeholder="Any additional context, doctor's interpretation, etc."
        value={data.notes || ''}
        onChange={(e) => handleChange('notes', e.target.value)}
        rows={3}
      />
    </div>
  );
}

export function createEmptyLabResult(): LabResultFormData {
  return {
    type: 'lab_result',
    date: new Date().toISOString().split('T')[0],
    title: '',
    labName: undefined,
    orderingDoctor: undefined,
    biomarkers: [],
    notes: '',
  };
}
