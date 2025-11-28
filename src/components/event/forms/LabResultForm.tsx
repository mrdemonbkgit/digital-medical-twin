import { Link } from 'react-router-dom';
import { FileUp } from 'lucide-react';
import type { LabResult, Biomarker, ClientGender } from '@/types';
import { Input, TextArea, Select, TagInput } from '@/components/common';
import { DatePicker } from '@/components/forms';
import { BiomarkerInput } from '../BiomarkerInput';
import { PRESET_OPTIONS, presetToBiomarkers } from '@/lib/biomarkerPresets';
import { useUserTags } from '@/hooks';
import { ROUTES } from '@/routes/routes';

type LabResultFormData = Omit<LabResult, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface LabResultFormProps {
  data: LabResultFormData;
  onChange: (data: LabResultFormData) => void;
  errors?: Record<string, string>;
}

export function LabResultForm({ data, onChange, errors }: LabResultFormProps) {
  const { tags: suggestedTags } = useUserTags();

  const handleChange = <K extends keyof LabResultFormData>(
    field: K,
    value: LabResultFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const handleBiomarkersChange = (biomarkers: Biomarker[]) => {
    handleChange('biomarkers', biomarkers);
  };

  const handlePresetSelect = (presetKey: string) => {
    if (!presetKey) return;

    const presetBiomarkers = presetToBiomarkers(presetKey);
    const existingNames = new Set(data.biomarkers.map((b) => b.name.toLowerCase()));
    const newBiomarkers = presetBiomarkers.filter(
      (b) => !existingNames.has(b.name.toLowerCase())
    );

    const updates: Partial<LabResultFormData> = {
      biomarkers: [...data.biomarkers, ...newBiomarkers],
    };

    const preset = PRESET_OPTIONS.find((p) => p.value === presetKey);
    if (preset && !data.title) {
      updates.title = preset.label;
    }

    onChange({ ...data, ...updates });
  };

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-4">
      {/* Upload PDF Helper Link */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileUp className="h-5 w-5 text-cyan-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-cyan-800">
              Have a lab result PDF?{' '}
              <Link to={ROUTES.LAB_UPLOADS} className="font-medium underline hover:text-cyan-900">
                Upload it here
              </Link>{' '}
              for automatic data extraction with AI.
            </p>
          </div>
        </div>
      </div>

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

      {/* Patient Info Section */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Patient Information</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Client Name"
            placeholder="Patient name"
            value={data.clientName || ''}
            onChange={(e) => handleChange('clientName', e.target.value || undefined)}
          />
          <Select
            label="Gender"
            placeholder="Select gender"
            options={genderOptions}
            value={data.clientGender || ''}
            onChange={(e) => handleChange('clientGender', (e.target.value as ClientGender) || undefined)}
          />
          <DatePicker
            label="Birthday"
            value={data.clientBirthday || ''}
            onChange={(e) => handleChange('clientBirthday', e.target.value || undefined)}
          />
        </div>
      </div>

      {/* Lab Info Section */}
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

      {/* Biomarkers Section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="mb-4">
          <Select
            label="Quick Add: Lab Panel Preset"
            placeholder="Select a preset to add biomarkers..."
            options={PRESET_OPTIONS}
            value=""
            onChange={(e) => handlePresetSelect(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            Select a preset to add common biomarkers with reference ranges. You can still edit values after.
          </p>
        </div>

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

      <TagInput
        label="Tags (optional)"
        tags={data.tags || []}
        onChange={(tags) => handleChange('tags', tags.length > 0 ? tags : undefined)}
        suggestions={suggestedTags}
        placeholder="Add tags like 'routine', 'fasting', 'follow-up'..."
      />
    </div>
  );
}

export function createEmptyLabResult(): LabResultFormData {
  return {
    type: 'lab_result',
    date: new Date().toISOString().split('T')[0],
    title: '',
    clientName: undefined,
    clientGender: undefined,
    clientBirthday: undefined,
    labName: undefined,
    orderingDoctor: undefined,
    biomarkers: [],
    attachments: undefined,
    notes: '',
    tags: undefined,
  };
}
