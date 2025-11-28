import { Plus, Trash2 } from 'lucide-react';
import type { Biomarker } from '@/types';
import { Button, Input } from '@/components/common';
import { cn } from '@/utils/cn';

interface BiomarkerInputProps {
  biomarkers: Biomarker[];
  onChange: (biomarkers: Biomarker[]) => void;
  error?: string;
}

const emptyBiomarker: Biomarker = {
  name: '',
  value: 0,
  unit: '',
  referenceMin: undefined,
  referenceMax: undefined,
  flag: undefined,
};

function calculateFlag(
  value: number,
  min?: number,
  max?: number
): 'high' | 'low' | 'normal' | undefined {
  if (min === undefined && max === undefined) return undefined;
  if (min !== undefined && value < min) return 'low';
  if (max !== undefined && value > max) return 'high';
  return 'normal';
}

export function BiomarkerInput({
  biomarkers,
  onChange,
  error,
}: BiomarkerInputProps) {
  const handleAdd = () => {
    onChange([...biomarkers, { ...emptyBiomarker }]);
  };

  const handleRemove = (index: number) => {
    onChange(biomarkers.filter((_, i) => i !== index));
  };

  const handleChange = (
    index: number,
    field: keyof Biomarker,
    value: string | number
  ) => {
    const updated = biomarkers.map((b, i) => {
      if (i !== index) return b;

      const newBiomarker = { ...b, [field]: value };

      // Recalculate flag when value or reference range changes
      if (field === 'value' || field === 'referenceMin' || field === 'referenceMax') {
        newBiomarker.flag = calculateFlag(
          field === 'value' ? (value as number) : newBiomarker.value,
          field === 'referenceMin' ? (value as number) : newBiomarker.referenceMin,
          field === 'referenceMax' ? (value as number) : newBiomarker.referenceMax
        );
      }

      return newBiomarker;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Biomarkers
        </label>
        <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1" />
          Add Biomarker
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {biomarkers.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-lg">
          No biomarkers added yet. Click "Add Biomarker" to start.
        </p>
      ) : (
        <div className="space-y-4">
          {biomarkers.map((biomarker, index) => (
            <div
              key={index}
              className={cn(
                'p-4 border rounded-lg space-y-3',
                biomarker.flag === 'high' && 'border-red-300 bg-red-50',
                biomarker.flag === 'low' && 'border-blue-300 bg-blue-50',
                biomarker.flag === 'normal' && 'border-green-300 bg-green-50',
                !biomarker.flag && 'border-gray-200 bg-gray-50'
              )}
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Biomarker {index + 1}
                  {biomarker.flag && (
                    <span
                      className={cn(
                        'ml-2 text-xs uppercase px-2 py-0.5 rounded',
                        biomarker.flag === 'high' &&
                          'bg-red-100 text-red-700',
                        biomarker.flag === 'low' &&
                          'bg-blue-100 text-blue-700',
                        biomarker.flag === 'normal' &&
                          'bg-green-100 text-green-700'
                      )}
                    >
                      {biomarker.flag}
                    </span>
                  )}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Name"
                  placeholder="e.g., Hemoglobin A1c"
                  value={biomarker.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Value"
                    type="number"
                    step="any"
                    value={biomarker.value || ''}
                    onChange={(e) =>
                      handleChange(index, 'value', parseFloat(e.target.value) || 0)
                    }
                  />
                  <Input
                    label="Unit"
                    placeholder="e.g., %"
                    value={biomarker.unit}
                    onChange={(e) => handleChange(index, 'unit', e.target.value)}
                  />
                </div>
              </div>

              {/* Secondary value/unit (if available from PDF extraction) */}
              {(biomarker.secondaryValue !== undefined || biomarker.secondaryUnit) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Secondary Value"
                      type="number"
                      step="any"
                      value={biomarker.secondaryValue ?? ''}
                      onChange={(e) =>
                        handleChange(
                          index,
                          'secondaryValue',
                          e.target.value ? parseFloat(e.target.value) : undefined as unknown as number
                        )
                      }
                    />
                    <Input
                      label="Secondary Unit"
                      placeholder="e.g., mmol/L"
                      value={biomarker.secondaryUnit ?? ''}
                      onChange={(e) => handleChange(index, 'secondaryUnit', e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 self-end pb-2">
                    Alternative unit from lab report
                  </p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Reference Min (optional)"
                  type="number"
                  step="any"
                  placeholder="e.g., 4.0"
                  value={biomarker.referenceMin ?? ''}
                  onChange={(e) =>
                    handleChange(
                      index,
                      'referenceMin',
                      e.target.value ? parseFloat(e.target.value) : undefined as unknown as number
                    )
                  }
                />
                <Input
                  label="Reference Max (optional)"
                  type="number"
                  step="any"
                  placeholder="e.g., 5.6"
                  value={biomarker.referenceMax ?? ''}
                  onChange={(e) =>
                    handleChange(
                      index,
                      'referenceMax',
                      e.target.value ? parseFloat(e.target.value) : undefined as unknown as number
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
