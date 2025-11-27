import type { LabResult, Biomarker } from '@/types';
import { Input, TextArea, Select, TagInput } from '@/components/common';
import { DatePicker } from '@/components/forms';
import { BiomarkerInput } from '../BiomarkerInput';
import { PRESET_OPTIONS, presetToBiomarkers } from '@/lib/biomarkerPresets';
import { useUserTags } from '@/hooks/useUserTags';

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
    // Append preset biomarkers to existing ones (avoid duplicates by name)
    const existingNames = new Set(data.biomarkers.map((b) => b.name.toLowerCase()));
    const newBiomarkers = presetBiomarkers.filter(
      (b) => !existingNames.has(b.name.toLowerCase())
    );

    // Build updates object - must batch all changes in single onChange call
    // to avoid stale closure issues
    const updates: Partial<LabResultFormData> = {
      biomarkers: [...data.biomarkers, ...newBiomarkers],
    };

    // Auto-fill title if empty
    const preset = PRESET_OPTIONS.find((p) => p.value === presetKey);
    if (preset && !data.title) {
      updates.title = preset.label;
    }

    onChange({ ...data, ...updates });
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
    labName: undefined,
    orderingDoctor: undefined,
    biomarkers: [],
    notes: '',
    tags: undefined,
  };
}
