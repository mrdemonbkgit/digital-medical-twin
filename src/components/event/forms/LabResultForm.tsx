import { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import type { LabResult, Biomarker, LabResultAttachment, ClientGender } from '@/types';
import { Input, TextArea, Select, TagInput, Button, PDFUpload, ExtractionStatus } from '@/components/common';
import { DatePicker } from '@/components/forms';
import { BiomarkerInput } from '../BiomarkerInput';
import { PRESET_OPTIONS, presetToBiomarkers } from '@/lib/biomarkerPresets';
import { useUserTags, usePDFUpload } from '@/hooks';
import { supabase } from '@/lib/supabase';

type LabResultFormData = Omit<LabResult, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface LabResultFormProps {
  data: LabResultFormData;
  onChange: (data: LabResultFormData) => void;
  errors?: Record<string, string>;
}

interface ExtractionResponse {
  success: boolean;
  clientName?: string;
  clientGender?: ClientGender;
  clientBirthday?: string;
  labName?: string;
  orderingDoctor?: string;
  testDate?: string;
  biomarkers: Biomarker[];
  extractionConfidence: number;
  verificationPassed: boolean;
  corrections?: string[];
  error?: string;
}

export function LabResultForm({ data, onChange, errors }: LabResultFormProps) {
  const { tags: suggestedTags } = useUserTags();
  const {
    uploadPDF,
    deletePDF,
    isUploading,
    uploadProgress,
    extractionStage,
    setExtractionStage,
    error: uploadError,
    clearError,
  } = usePDFUpload();

  const [attachment, setAttachment] = useState<LabResultAttachment | null>(data.attachments?.[0] || null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [verificationPassed, setVerificationPassed] = useState<boolean | undefined>();
  const [corrections, setCorrections] = useState<string[]>([]);

  const isExtracting = extractionStage === 'extracting_gemini' || extractionStage === 'verifying_gpt';

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

  const handleUpload = useCallback(async (file: File) => {
    clearError();
    setExtractionError(null);
    const uploaded = await uploadPDF(file);
    setAttachment(uploaded);
    handleChange('attachments', [uploaded]);
    // Reset extraction stage after upload completes (before AI extraction)
    setExtractionStage('idle');
    return uploaded;
  }, [uploadPDF, clearError, setExtractionStage]);

  const handleDelete = useCallback(async (storagePath: string) => {
    await deletePDF(storagePath);
    setAttachment(null);
    handleChange('attachments', undefined);
    setVerificationPassed(undefined);
    setCorrections([]);
  }, [deletePDF]);

  const handleExtract = useCallback(async () => {
    if (!attachment) return;

    console.log('[Extraction] Starting extraction process with SSE...');
    setExtractionStage('fetching_pdf');
    setExtractionError(null);
    setVerificationPassed(undefined);
    setCorrections([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      console.log('[Extraction] Calling extraction API with SSE...');
      const response = await fetch('/api/ai/extract-lab-results', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ storagePath: attachment.storagePath }),
      });

      const contentType = response.headers.get('content-type') || '';
      console.log('[Extraction] Response content-type:', contentType);
      console.log('[Extraction] Response status:', response.status);

      // Check if we got SSE response
      const isSSE = contentType.includes('text/event-stream');

      if (!response.ok) {
        // Try to parse error as JSON, fallback to text
        let errorMessage = 'Extraction failed';
        const responseText = await response.text();
        console.error('[Extraction] API error response:', responseText.substring(0, 500));

        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // If not SSE, handle as regular JSON response (fallback)
      if (!isSSE) {
        console.log('[Extraction] Falling back to JSON response mode');
        const result: ExtractionResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Extraction failed');
        }

        // Update form with extracted data
        const updates: Partial<LabResultFormData> = {};
        if (result.clientName) updates.clientName = result.clientName;
        if (result.clientGender) updates.clientGender = result.clientGender;
        if (result.clientBirthday) updates.clientBirthday = result.clientBirthday;
        if (result.labName) updates.labName = result.labName;
        if (result.orderingDoctor) updates.orderingDoctor = result.orderingDoctor;
        if (result.testDate) updates.date = result.testDate;
        if (result.biomarkers && result.biomarkers.length > 0) {
          updates.biomarkers = result.biomarkers;
        }
        if (!data.title && result.labName) {
          updates.title = `Lab Results - ${result.labName}`;
        }

        onChange({ ...data, ...updates });
        setVerificationPassed(result.verificationPassed);
        setCorrections(result.corrections || []);
        setExtractionStage('complete');
        console.log('[Extraction] Extraction complete (JSON mode)!');
        return;
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            try {
              const event = JSON.parse(jsonStr);
              console.log('[Extraction] SSE event:', event);

              if (event.type === 'stage') {
                // Update extraction stage based on server event
                if (event.stage === 'fetching_pdf') {
                  setExtractionStage('fetching_pdf');
                } else if (event.stage === 'extracting_gemini') {
                  setExtractionStage('extracting_gemini');
                } else if (event.stage === 'verifying_gpt') {
                  setExtractionStage('verifying_gpt');
                }
              } else if (event.type === 'complete') {
                const result: ExtractionResponse = event.data;
                console.log('[Extraction] API response received:', {
                  success: result.success,
                  biomarkerCount: result.biomarkers?.length,
                  verificationPassed: result.verificationPassed,
                  correctionsCount: result.corrections?.length || 0,
                });

                if (!result.success) {
                  throw new Error(result.error || 'Extraction failed');
                }

                // Update form with extracted data
                const updates: Partial<LabResultFormData> = {};

                if (result.clientName) updates.clientName = result.clientName;
                if (result.clientGender) updates.clientGender = result.clientGender;
                if (result.clientBirthday) updates.clientBirthday = result.clientBirthday;
                if (result.labName) updates.labName = result.labName;
                if (result.orderingDoctor) updates.orderingDoctor = result.orderingDoctor;
                if (result.testDate) updates.date = result.testDate;
                if (result.biomarkers && result.biomarkers.length > 0) {
                  updates.biomarkers = result.biomarkers;
                }
                if (!data.title && result.labName) {
                  updates.title = `Lab Results - ${result.labName}`;
                }

                onChange({ ...data, ...updates });
                setVerificationPassed(result.verificationPassed);
                setCorrections(result.corrections || []);
                setExtractionStage('complete');
                console.log('[Extraction] Extraction complete!');
              } else if (event.type === 'error') {
                throw new Error(event.error || 'Extraction failed');
              }
            } catch (parseErr) {
              // Only throw if it's not a JSON parse error
              if (parseErr instanceof SyntaxError) {
                console.warn('[Extraction] Failed to parse SSE data:', jsonStr);
              } else {
                throw parseErr;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[Extraction] Error:', err);
      setExtractionError(err instanceof Error ? err.message : 'Extraction failed');
      setExtractionStage('error');
    }
  }, [attachment, data, onChange, setExtractionStage]);

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-4">
      {/* PDF Upload Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Upload Lab Result PDF (optional)
        </label>
        <PDFUpload
          attachment={attachment}
          onUpload={handleUpload}
          onDelete={handleDelete}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          error={uploadError}
          disabled={isExtracting}
        />

        {attachment && !isExtracting && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleExtract}
            disabled={isExtracting}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Extract Data with AI
          </Button>
        )}

        <ExtractionStatus
          extractionStage={extractionStage}
          verificationPassed={verificationPassed}
          corrections={corrections}
          biomarkerCount={data.biomarkers.length}
        />

        {extractionError && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {extractionError}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <Input
          label="Title"
          placeholder="e.g., Comprehensive Metabolic Panel, Lipid Panel"
          value={data.title}
          onChange={(e) => handleChange('title', e.target.value)}
          error={errors?.title}
          required
        />
      </div>

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
