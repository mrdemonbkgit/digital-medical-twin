import { Link } from 'react-router-dom';
import { FileUp } from 'lucide-react';
import type { LabResult, Biomarker, Gender } from '@/types';
import { Input, TextArea, TagInput } from '@/components/common';
import { DatePicker } from '@/components/forms';
import { BiomarkerInput } from '../BiomarkerInput';
import { useBiomarkers, useUserTags, useUserProfile } from '@/hooks';
import { ROUTES } from '@/routes/routes';

type LabResultFormData = Omit<LabResult, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface LabResultFormProps {
  data: LabResultFormData;
  onChange: (data: LabResultFormData) => void;
  errors?: Record<string, string>;
}

export function LabResultForm({ data, onChange, errors }: LabResultFormProps) {
  const { tags: suggestedTags } = useUserTags();
  const { biomarkers: biomarkerStandards, isLoading: isLoadingStandards } = useBiomarkers({});
  const { profile } = useUserProfile();

  // Get user's gender for reference ranges (default to male)
  const userGender: Gender = profile?.gender || 'male';

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
      {/* Upload PDF Helper Link */}
      <div className="bg-info-muted border border-info rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileUp className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-info">
              Have a lab result PDF?{' '}
              <Link to={ROUTES.LAB_UPLOADS} className="font-medium underline hover:opacity-80">
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
      <div className="border-t border-theme-primary pt-4">
        <BiomarkerInput
          biomarkers={data.biomarkers}
          onChange={handleBiomarkersChange}
          availableStandards={biomarkerStandards}
          userGender={userGender}
          isLoading={isLoadingStandards}
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
    attachments: undefined,
    notes: '',
    tags: undefined,
  };
}
