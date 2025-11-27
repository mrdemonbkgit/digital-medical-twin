import type { Intervention, InterventionCategory } from '@/types';
import { Input, Select, TextArea, TagInput, type SelectOption } from '@/components/common';
import { DatePicker } from '@/components/forms';
import { useUserTags } from '@/hooks/useUserTags';

type InterventionFormData = Omit<Intervention, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface InterventionFormProps {
  data: InterventionFormData;
  onChange: (data: InterventionFormData) => void;
  errors?: Record<string, string>;
}

const categoryOptions: SelectOption[] = [
  { value: 'diet', label: 'Diet' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'stress', label: 'Stress Management' },
  { value: 'other', label: 'Other' },
];

export function InterventionForm({ data, onChange, errors }: InterventionFormProps) {
  const { tags: suggestedTags } = useUserTags();

  const handleChange = <K extends keyof InterventionFormData>(
    field: K,
    value: InterventionFormData[K]
  ) => {
    // Update isOngoing based on endDate
    const updates: Partial<InterventionFormData> = { [field]: value };
    if (field === 'endDate') {
      updates.isOngoing = !value;
    }
    onChange({ ...data, ...updates });
  };

  return (
    <div className="space-y-4">
      <Input
        label="Title"
        placeholder="e.g., Started Keto Diet, Morning Running Routine"
        value={data.title}
        onChange={(e) => handleChange('title', e.target.value)}
        error={errors?.title}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Intervention Name"
          placeholder="e.g., Ketogenic Diet, Zone 2 Training"
          value={data.interventionName}
          onChange={(e) => handleChange('interventionName', e.target.value)}
          error={errors?.interventionName}
          required
        />
        <Select
          label="Category"
          options={categoryOptions}
          value={data.category}
          onChange={(e) => handleChange('category', e.target.value as InterventionCategory)}
          error={errors?.category}
          required
        />
      </div>

      <DatePicker
        label="Event Date"
        value={data.date}
        onChange={(e) => handleChange('date', e.target.value)}
        error={errors?.date}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker
          label="Start Date"
          value={data.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          error={errors?.startDate}
          required
        />
        <DatePicker
          label="End Date (leave empty if ongoing)"
          value={data.endDate || ''}
          onChange={(e) => handleChange('endDate', e.target.value || undefined)}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isOngoing"
          checked={data.isOngoing}
          onChange={(e) => {
            handleChange('isOngoing', e.target.checked);
            if (e.target.checked) {
              handleChange('endDate', undefined);
            }
          }}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isOngoing" className="text-sm text-gray-700">
          Currently ongoing
        </label>
      </div>

      <TextArea
        label="Protocol (optional)"
        placeholder="Describe the intervention protocol, frequency, details..."
        value={data.protocol || ''}
        onChange={(e) => handleChange('protocol', e.target.value || undefined)}
        rows={4}
      />

      <TextArea
        label="Notes (optional)"
        placeholder="Any additional observations or context..."
        value={data.notes || ''}
        onChange={(e) => handleChange('notes', e.target.value)}
        rows={3}
      />

      <TagInput
        label="Tags (optional)"
        tags={data.tags || []}
        onChange={(tags) => handleChange('tags', tags.length > 0 ? tags : undefined)}
        suggestions={suggestedTags}
        placeholder="Add tags like 'experiment', 'n=1', 'lifestyle'..."
      />
    </div>
  );
}

export function createEmptyIntervention(): InterventionFormData {
  const today = new Date().toISOString().split('T')[0];
  return {
    type: 'intervention',
    date: today,
    title: '',
    interventionName: '',
    category: 'other',
    startDate: today,
    endDate: undefined,
    protocol: undefined,
    isOngoing: true,
    notes: '',
    tags: undefined,
  };
}
