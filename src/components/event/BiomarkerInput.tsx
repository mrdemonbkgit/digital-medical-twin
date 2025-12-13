import { Plus, Trash2 } from 'lucide-react';
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
  value: number | string,
  min?: number,
  max?: number
): 'high' | 'low' | 'normal' | undefined {
  // Qualitative values (strings) don't have flags
  if (typeof value === 'string') return undefined;
  if (min === undefined && max === undefined) return undefined;
  if (min !== undefined && value < min) return 'low';
  if (max !== undefined && value > max) return 'high';
  return 'normal';
}

// Helper to check if a biomarker standard is qualitative
function isQualitativeStandard(standard: BiomarkerStandard): boolean {
  return standard.standardUnit === 'qualitative';
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

      // Check if this is a qualitative biomarker
      const isQualitative = isQualitativeStandard(standard);

      if (isQualitative) {
        // Qualitative biomarkers have string values and no reference ranges
        return {
          standardCode: standard.code,
          name: standard.name,
          value: typeof b.value === 'string' ? b.value : '', // Keep existing string value or start empty
          unit: standard.standardUnit,
          referenceMin: undefined,
          referenceMax: undefined,
          flag: undefined,
        };
      }

      // Get gender-specific reference range (default to male)
      const gender = userGender === 'female' ? 'female' : 'male';
      const range = standard.referenceRanges[gender];
      const numericValue = typeof b.value === 'number' ? b.value : 0;

      return {
        standardCode: standard.code,
        name: standard.name,
        value: numericValue, // Keep existing value if any
        unit: standard.standardUnit,
        referenceMin: range.low,
        referenceMax: range.high,
        flag: calculateFlag(numericValue, range.low, range.high),
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

  const handleQualitativeValueChange = (index: number, value: string) => {
    const updated = biomarkers.map((b, i) => {
      if (i !== index) return b;

      return {
        ...b,
        value,
        flag: undefined, // Qualitative values don't have flags
      };
    });

    onChange(updated);
  };

  // Helper to check if a biomarker at index is qualitative
  const isBiomarkerQualitative = (index: number): boolean => {
    const biomarker = biomarkers[index];
    if (!biomarker.standardCode) return false;
    const standard = availableStandards.find(s => s.code === biomarker.standardCode);
    return standard ? isQualitativeStandard(standard) : false;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-theme-secondary">
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

      {error && <p className="text-sm text-danger">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-theme-tertiary text-center py-4 border border-dashed border-theme-primary rounded-lg">
          Loading biomarker standards...
        </p>
      ) : biomarkers.length === 0 ? (
        <p className="text-sm text-theme-tertiary text-center py-4 border border-dashed border-theme-primary rounded-lg">
          No biomarkers added yet. Click "Add Biomarker" to start.
        </p>
      ) : (
        <div className="space-y-4">
          {biomarkers.map((biomarker, index) => (
            <div
              key={index}
              className={cn(
                'p-4 border rounded-lg space-y-3',
                biomarker.flag === 'high' && 'border-danger bg-danger-muted',
                biomarker.flag === 'low' && 'border-info bg-info-muted',
                biomarker.flag === 'normal' && 'border-success bg-success-muted',
                !biomarker.flag && 'border-theme-primary bg-theme-secondary'
              )}
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-theme-secondary">
                  Biomarker {index + 1}
                  {biomarker.flag && (
                    <span
                      className={cn(
                        'ml-2 text-xs uppercase px-2 py-0.5 rounded',
                        biomarker.flag === 'high' && 'bg-danger-muted text-danger',
                        biomarker.flag === 'low' && 'bg-info-muted text-info',
                        biomarker.flag === 'normal' && 'bg-success-muted text-success'
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
                  className="p-2.5 min-w-[44px] min-h-[44px] text-danger hover:text-danger hover:bg-danger-muted"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <BiomarkerSelect
                  biomarkers={availableStandards}
                  value={biomarker.standardCode || null}
                  onChange={(standard) => handleSelectBiomarker(index, standard)}
                  excludeCodes={usedCodes.filter((code): code is string => code !== undefined && code !== biomarker.standardCode)}
                />
                <div className="grid grid-cols-2 gap-3">
                  {isBiomarkerQualitative(index) ? (
                    <Input
                      label="Value"
                      type="text"
                      placeholder="e.g., Negative, Positive"
                      value={typeof biomarker.value === 'string' ? biomarker.value : ''}
                      onChange={(e) => handleQualitativeValueChange(index, e.target.value)}
                      disabled={!biomarker.standardCode}
                    />
                  ) : (
                    <Input
                      label="Value"
                      type="number"
                      step="any"
                      value={typeof biomarker.value === 'number' ? biomarker.value : ''}
                      onChange={(e) =>
                        handleValueChange(index, parseFloat(e.target.value) || 0)
                      }
                      disabled={!biomarker.standardCode}
                    />
                  )}
                  <Input
                    label="Unit"
                    value={biomarker.unit === 'qualitative' ? 'Qualitative' : biomarker.unit}
                    disabled
                    className="bg-theme-tertiary"
                  />
                </div>
              </div>

              {/* Reference range display (read-only) - only for quantitative biomarkers */}
              {biomarker.standardCode && !isBiomarkerQualitative(index) && biomarker.referenceMin !== undefined && (
                <div className="flex items-center gap-4 text-sm text-theme-tertiary">
                  <span>
                    Reference Range:{' '}
                    <span className="text-theme-secondary">
                      {biomarker.referenceMin} - {biomarker.referenceMax} {biomarker.unit}
                    </span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
