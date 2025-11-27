import type { Metric, MetricSource } from '@/types';
import { Input, Select, TextArea, TagInput, type SelectOption } from '@/components/common';
import { DatePicker } from '@/components/forms';
import { useUserTags } from '@/hooks/useUserTags';

type MetricFormData = Omit<Metric, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface MetricFormProps {
  data: MetricFormData;
  onChange: (data: MetricFormData) => void;
  errors?: Record<string, string>;
}

const sourceOptions: SelectOption[] = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'whoop', label: 'Whoop' },
  { value: 'oura', label: 'Oura Ring' },
  { value: 'apple_health', label: 'Apple Health' },
  { value: 'garmin', label: 'Garmin' },
];

export function MetricForm({ data, onChange, errors }: MetricFormProps) {
  const { tags: suggestedTags } = useUserTags();

  const handleChange = <K extends keyof MetricFormData>(
    field: K,
    value: MetricFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <Input
        label="Title"
        placeholder="e.g., Morning Heart Rate"
        value={data.title}
        onChange={(e) => handleChange('title', e.target.value)}
        error={errors?.title}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker
          label="Date"
          value={data.date}
          onChange={(e) => handleChange('date', e.target.value)}
          error={errors?.date}
          required
        />
        <Select
          label="Source"
          options={sourceOptions}
          value={data.source}
          onChange={(e) => handleChange('source', e.target.value as MetricSource)}
          error={errors?.source}
          required
        />
      </div>

      <Input
        label="Metric Name"
        placeholder="e.g., Resting Heart Rate, HRV, Sleep Score"
        value={data.metricName}
        onChange={(e) => handleChange('metricName', e.target.value)}
        error={errors?.metricName}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Value"
          type="number"
          step="any"
          placeholder="e.g., 58"
          value={data.value || ''}
          onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)}
          error={errors?.value}
          required
        />
        <Input
          label="Unit"
          placeholder="e.g., bpm, ms, score"
          value={data.unit}
          onChange={(e) => handleChange('unit', e.target.value)}
          error={errors?.unit}
          required
        />
      </div>

      <TextArea
        label="Notes (optional)"
        placeholder="Any additional context or observations..."
        value={data.notes || ''}
        onChange={(e) => handleChange('notes', e.target.value)}
        rows={3}
      />

      <TagInput
        label="Tags (optional)"
        tags={data.tags || []}
        onChange={(tags) => handleChange('tags', tags.length > 0 ? tags : undefined)}
        suggestions={suggestedTags}
        placeholder="Add tags like 'morning', 'post-workout', 'fasted'..."
      />
    </div>
  );
}

export function createEmptyMetric(): MetricFormData {
  return {
    type: 'metric',
    date: new Date().toISOString().split('T')[0],
    title: '',
    source: 'manual',
    metricName: '',
    value: 0,
    unit: '',
    notes: '',
    tags: undefined,
  };
}
