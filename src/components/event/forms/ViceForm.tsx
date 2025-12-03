import { EyeOff } from 'lucide-react';
import type { Vice, ViceCategory } from '@/types';
import { Input, Select, TextArea, TagInput, type SelectOption } from '@/components/common';
import { DatePicker } from '@/components/forms';
import { useUserTags } from '@/hooks/useUserTags';

type ViceFormData = Omit<Vice, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface ViceFormProps {
  data: ViceFormData;
  onChange: (data: ViceFormData) => void;
  errors?: Record<string, string>;
}

const categoryOptions: SelectOption[] = [
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'pornography', label: 'Pornography' },
  { value: 'smoking', label: 'Smoking/Vaping' },
  { value: 'drugs', label: 'Recreational Drugs' },
];

const unitOptions: Record<ViceCategory, SelectOption[]> = {
  alcohol: [
    { value: 'drinks', label: 'Drinks' },
    { value: 'units', label: 'Units' },
    { value: 'ml', label: 'ml' },
    { value: 'oz', label: 'oz' },
  ],
  pornography: [
    { value: 'minutes', label: 'Minutes' },
    { value: 'sessions', label: 'Sessions' },
  ],
  smoking: [
    { value: 'cigarettes', label: 'Cigarettes' },
    { value: 'puffs', label: 'Puffs' },
    { value: 'pods', label: 'Pods' },
  ],
  drugs: [
    { value: 'mg', label: 'mg' },
    { value: 'uses', label: 'Uses' },
    { value: 'hits', label: 'Hits' },
  ],
};

const contextOptions: SelectOption[] = [
  { value: '', label: 'Select context (optional)' },
  { value: 'social', label: 'Social' },
  { value: 'stress', label: 'Stress' },
  { value: 'boredom', label: 'Boredom' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'habit', label: 'Habit' },
  { value: 'craving', label: 'Craving' },
  { value: 'other', label: 'Other' },
];

export function ViceForm({ data, onChange, errors }: ViceFormProps) {
  const { tags: suggestedTags } = useUserTags();

  const handleChange = <K extends keyof ViceFormData>(
    field: K,
    value: ViceFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const currentUnitOptions = unitOptions[data.viceCategory] || unitOptions.alcohol;

  return (
    <div className="space-y-4">
      {/* Privacy notice */}
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-slate-50 rounded-lg border border-slate-200">
        <EyeOff className="w-4 h-4 flex-shrink-0" />
        <span>This entry is private and won't appear on your main timeline.</span>
      </div>

      <Input
        label="Title"
        placeholder="e.g., Weekend drinks, Relapse, etc."
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
          label="Category"
          options={categoryOptions}
          value={data.viceCategory}
          onChange={(e) => {
            const newCategory = e.target.value as ViceCategory;
            // Update category and reset unit in a single call to avoid race condition
            onChange({ ...data, viceCategory: newCategory, unit: undefined });
          }}
          error={errors?.viceCategory}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Amount (optional)"
          type="number"
          step="any"
          placeholder="e.g., 3"
          value={data.quantity ?? ''}
          onChange={(e) =>
            handleChange('quantity', e.target.value ? parseFloat(e.target.value) : undefined)
          }
          error={errors?.quantity}
        />
        <Select
          label="Unit"
          options={[{ value: '', label: 'Select unit' }, ...currentUnitOptions]}
          value={data.unit || ''}
          onChange={(e) => handleChange('unit', e.target.value || undefined)}
          error={errors?.unit}
        />
      </div>

      <Select
        label="Context"
        options={contextOptions}
        value={data.context || ''}
        onChange={(e) => handleChange('context', e.target.value || undefined)}
        error={errors?.context}
      />

      <Input
        label="Trigger (optional)"
        placeholder="What prompted this? e.g., argument, party, etc."
        value={data.trigger || ''}
        onChange={(e) => handleChange('trigger', e.target.value || undefined)}
        error={errors?.trigger}
      />

      <TextArea
        label="Notes (optional)"
        placeholder="Any additional thoughts or observations..."
        value={data.notes || ''}
        onChange={(e) => handleChange('notes', e.target.value)}
        rows={3}
      />

      <TagInput
        label="Tags (optional)"
        tags={data.tags || []}
        onChange={(tags) => handleChange('tags', tags.length > 0 ? tags : undefined)}
        suggestions={suggestedTags}
        placeholder="Add tags like 'weekend', 'relapse', 'recovery'..."
      />
    </div>
  );
}

export function createEmptyVice(): ViceFormData {
  return {
    type: 'vice',
    date: new Date().toISOString().split('T')[0],
    title: '',
    viceCategory: 'alcohol',
    quantity: undefined,
    unit: undefined,
    context: undefined,
    trigger: undefined,
    notes: '',
    tags: undefined,
    isPrivate: true,
  };
}
