import { Plus, Trash2, AlertCircle } from 'lucide-react';
import type { Biomarker, BiomarkerStandard, Gender } from '@/types';
import { Button, Input } from '@/components/common';
import { BiomarkerSelect } from './BiomarkerSelect';
import { cn } from '@/utils/cn';

interface BiomarkerInputProps {
  biomarkers: Biomarker[];
  onChange: (biomarkers: Biomarker[]) => void;
  availableStandards: BiomarkerStandard[];
  userGender?: Gender;
  error?: string;
  isLoading?: boolean;
}

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

// Check if a biomarker has an invalid value (used for form validation warnings)
function hasInvalidValue(biomarker: Biomarker): boolean {
  // Only validate if a biomarker has been selected (has standardCode)
  if (!biomarker.standardCode) return false;
  // Value must be greater than 0 for any biomarker
  return biomarker.value <= 0;
}

export function BiomarkerInput({
  biomarkers,
  onChange,
  availableStandards,
  userGender = 'male',
  error,
  isLoading = false,
}: BiomarkerInputProps) {
  // Get list of already-used standard codes to prevent duplicates
  const usedCodes = biomarkers.map((b) => b.standardCode).filter(Boolean);

  const handleAdd = () => {
    // Add empty biomarker entry (user will select from dropdown)
    onChange([
      ...biomarkers,
      {
        standardCode: '',
        name: '',
        value: 0,
        unit: '',
        referenceMin: undefined,
        referenceMax: undefined,
        flag: undefined,
      },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(biomarkers.filter((_, i) => i !== index));
  };

  const handleSelectBiomarker = (index: number, standard: BiomarkerStandard | null) => {
    const updated = biomarkers.map((b, i) => {
      if (i !== index) return b;

      if (!standard) {
        // Cleared selection
        return {
          standardCode: '',
          name: '',
          value: 0,
          unit: '',
          referenceMin: undefined,
          referenceMax: undefined,
          flag: undefined,
        };
      }

      // Get gender-specific reference range (default to male)
      const gender = userGender === 'female' ? 'female' : 'male';
      const range = standard.referenceRanges[gender];

      return {
        standardCode: standard.code,
        name: standard.name,
        value: b.value, // Keep existing value if any
        unit: standard.standardUnit,
        referenceMin: range.low,
        referenceMax: range.high,
        flag: calculateFlag(b.value, range.low, range.high),
      };
    });

    onChange(updated);
  };

  const handleValueChange = (index: number, value: number) => {
    const updated = biomarkers.map((b, i) => {
      if (i !== index) return b;

      return {
        ...b,
        value,
        flag: calculateFlag(value, b.referenceMin, b.referenceMax),
      };
    });

    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Biomarkers
        </label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          disabled={isLoading}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Biomarker
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-lg">
          Loading biomarker standards...
        </p>
      ) : biomarkers.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-lg">
          No biomarkers added yet. Click "Add Biomarker" to start.
        </p>
      ) : (
        <div className="space-y-4">
          {biomarkers.map((biomarker, index) => {
            const isInvalid = hasInvalidValue(biomarker);
            return (
            <div
              key={index}
              className={cn(
                'p-4 border rounded-lg space-y-3',
                isInvalid && 'border-orange-400 bg-orange-50',
                !isInvalid && biomarker.flag === 'high' && 'border-red-300 bg-red-50',
                !isInvalid && biomarker.flag === 'low' && 'border-blue-300 bg-blue-50',
                !isInvalid && biomarker.flag === 'normal' && 'border-green-300 bg-green-50',
                !isInvalid && !biomarker.flag && 'border-gray-200 bg-gray-50'
              )}
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Biomarker {index + 1}
                  {isInvalid && (
                    <span className="ml-2 text-xs uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                      Invalid Value
                    </span>
                  )}
                  {!isInvalid && biomarker.flag && (
                    <span
                      className={cn(
                        'ml-2 text-xs uppercase px-2 py-0.5 rounded',
                        biomarker.flag === 'high' && 'bg-red-100 text-red-700',
                        biomarker.flag === 'low' && 'bg-blue-100 text-blue-700',
                        biomarker.flag === 'normal' && 'bg-green-100 text-green-700'
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
                  className="p-2.5 min-w-[44px] min-h-[44px] text-red-600 hover:text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <BiomarkerSelect
                  biomarkers={availableStandards}
                  value={biomarker.standardCode || null}
                  onChange={(standard) => handleSelectBiomarker(index, standard)}
                  excludeCodes={usedCodes.filter((code): code is string => code !== undefined && code !== biomarker.standardCode)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Value"
                    type="number"
                    step="any"
                    value={biomarker.value || ''}
                    onChange={(e) =>
                      handleValueChange(index, parseFloat(e.target.value) || 0)
                    }
                    disabled={!biomarker.standardCode}
                  />
                  <Input
                    label="Unit"
                    value={biomarker.unit}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>

              {/* Reference range display (read-only) */}
              {biomarker.standardCode && (
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    Reference Range:{' '}
                    <span className="text-gray-700">
                      {biomarker.referenceMin} - {biomarker.referenceMax} {biomarker.unit}
                    </span>
                  </span>
                </div>
              )}

              {/* Invalid value warning */}
              {isInvalid && (
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <AlertCircle className="h-4 w-4" />
                  <span>Value must be greater than 0</span>
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
