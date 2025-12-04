import type { Medication } from '@/types';
import { Input, Select, TextArea, TagInput, type SelectOption } from '@/components/common';
import { DatePicker } from '@/components/forms';
import { useUserTags } from '@/hooks/useUserTags';

type MedicationFormData = Omit<Medication, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface MedicationFormProps {
  data: MedicationFormData;
  onChange: (data: MedicationFormData) => void;
  errors?: Record<string, string>;
}

const frequencyOptions: SelectOption[] = [
  { value: 'once daily', label: 'Once Daily' },
  { value: 'twice daily', label: 'Twice Daily' },
  { value: 'three times daily', label: 'Three Times Daily' },
  { value: 'four times daily', label: 'Four Times Daily' },
  { value: 'every morning', label: 'Every Morning' },
  { value: 'every evening', label: 'Every Evening' },
  { value: 'as needed', label: 'As Needed' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom (specify in notes)' },
];

export function MedicationForm({ data, onChange, errors }: MedicationFormProps) {
  const { tags: suggestedTags } = useUserTags();

  const handleChange = <K extends keyof MedicationFormData>(
    field: K,
    value: MedicationFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  // Auto-generate title from medication name if empty
  const handleMedicationNameChange = (value: string) => {
    const updates: Partial<MedicationFormData> = { medicationName: value };
    if (!data.title || data.title === data.medicationName) {
      updates.title = value;
    }
    onChange({ ...data, ...updates });
  };

  return (
    <div className="space-y-4">
      <Input
        label="Medication Name"
        placeholder="e.g., Metformin, Lisinopril, Vitamin D"
        value={data.medicationName}
        onChange={(e) => handleMedicationNameChange(e.target.value)}
        error={errors?.medicationName}
        required
      />

      <Input
        label="Title"
        placeholder="e.g., Started Metformin for blood sugar"
        value={data.title}
        onChange={(e) => handleChange('title', e.target.value)}
        error={errors?.title}
        required
      />

      <DatePicker
        label="Event Date"
        value={data.date}
        onChange={(e) => handleChange('date', e.target.value)}
        error={errors?.date}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Dosage"
          placeholder="e.g., 500mg, 10mg, 2000 IU"
          value={data.dosage}
          onChange={(e) => handleChange('dosage', e.target.value)}
          error={errors?.dosage}
          required
        />
        <Select
          label="Frequency"
          options={frequencyOptions}
          value={data.frequency}
          onChange={(e) => handleChange('frequency', e.target.value)}
          error={errors?.frequency}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Prescriber (optional)"
          placeholder="e.g., Dr. Smith"
          value={data.prescriber || ''}
          onChange={(e) => handleChange('prescriber', e.target.value || undefined)}
        />
        <Input
          label="Reason (optional)"
          placeholder="e.g., Blood sugar control"
          value={data.reason || ''}
          onChange={(e) => handleChange('reason', e.target.value || undefined)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker
          label="Start Date"
          value={data.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          error={errors?.startDate}
          required
        />
        <DatePicker
          label="End Date (if discontinued)"
          value={data.endDate || ''}
          onChange={(e) => {
            const endDate = e.target.value || undefined;
            handleChange('endDate', endDate);
            // Auto-set isActive based on end date
            if (endDate) {
              handleChange('isActive', false);
            }
          }}
        />
      </div>

      <label htmlFor="isActive" className="flex items-center gap-3 min-h-[44px] cursor-pointer">
        <input
          type="checkbox"
          id="isActive"
          checked={data.isActive}
          onChange={(e) => {
            handleChange('isActive', e.target.checked);
            if (e.target.checked) {
              handleChange('endDate', undefined);
            }
          }}
          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">
          Currently taking this medication
        </span>
      </label>

      <TextArea
        label="Notes (optional)"
        placeholder="Side effects, observations, dosage changes..."
        value={data.notes || ''}
        onChange={(e) => handleChange('notes', e.target.value)}
        rows={3}
      />

      <TagInput
        label="Tags (optional)"
        tags={data.tags || []}
        onChange={(tags) => handleChange('tags', tags.length > 0 ? tags : undefined)}
        suggestions={suggestedTags}
        placeholder="Add tags like 'prescription', 'supplement', 'prn'..."
      />
    </div>
  );
}

export function createEmptyMedication(): MedicationFormData {
  const today = new Date().toISOString().split('T')[0];
  return {
    type: 'medication',
    date: today,
    title: '',
    medicationName: '',
    dosage: '',
    frequency: 'once daily',
    prescriber: undefined,
    reason: undefined,
    startDate: today,
    endDate: undefined,
    isActive: true,
    sideEffects: undefined,
    notes: '',
    tags: undefined,
  };
}
