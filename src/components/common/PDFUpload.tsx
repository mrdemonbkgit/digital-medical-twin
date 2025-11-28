import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import type { LabResultAttachment } from '@/types/events';
import type { ExtractionStage } from '@/hooks/usePDFUpload';

interface PDFUploadProps {
  attachment: LabResultAttachment | null;
  onUpload: (file: File) => Promise<LabResultAttachment>;
  onDelete: (storagePath: string) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  disabled?: boolean;
}

export function PDFUpload({
  attachment,
  onUpload,
  onDelete,
  isUploading,
  uploadProgress,
  error,
  disabled = false,
}: PDFUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled || isUploading) return;
      try {
        await onUpload(file);
      } catch {
        // Error is handled by the hook
      }
    },
    [disabled, isUploading, onUpload]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file && file.type === 'application/pdf') {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDelete = useCallback(async () => {
    if (!attachment || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(attachment.storagePath);
    } catch {
      // Error is handled by the hook
    } finally {
      setIsDeleting(false);
    }
  }, [attachment, isDeleting, onDelete]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading && !attachment) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading, attachment]);

  // Show uploaded file
  if (attachment) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                {attachment.filename}
              </p>
              <p className="text-xs text-gray-500">
                Uploaded {new Date(attachment.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting || disabled}
              className="text-gray-400 hover:text-red-600"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show upload zone
  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isUploading ? (
          <div className="space-y-2">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">PDF files only (max 10MB)</p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}

// Status badge for extraction results
interface ExtractionStatusProps {
  extractionStage: ExtractionStage;
  verificationPassed?: boolean;
  corrections?: string[];
  biomarkerCount?: number;
}

const stageMessages: Record<ExtractionStage, { text: string; showSpinner: boolean }> = {
  idle: { text: '', showSpinner: false },
  uploading: { text: 'Uploading PDF...', showSpinner: true },
  fetching_pdf: { text: 'Fetching PDF from storage...', showSpinner: true },
  extracting_gemini: { text: 'Stage 1: Extracting with Gemini 3 Pro...', showSpinner: true },
  verifying_gpt: { text: 'Stage 2: Verifying with GPT-5.1...', showSpinner: true },
  complete: { text: 'Extraction complete!', showSpinner: false },
  error: { text: 'Extraction failed', showSpinner: false },
};

export function ExtractionStatus({
  extractionStage,
  verificationPassed,
  corrections,
  biomarkerCount,
}: ExtractionStatusProps) {
  // Show progress during active extraction stages
  if (extractionStage === 'uploading' || extractionStage === 'fetching_pdf' || extractionStage === 'extracting_gemini' || extractionStage === 'verifying_gpt') {
    const { text, showSpinner } = stageMessages[extractionStage];
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
        {showSpinner && <Loader2 className="h-4 w-4 animate-spin" />}
        {text}
      </div>
    );
  }

  // Show error state
  if (extractionStage === 'error') {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
        <AlertCircle className="h-4 w-4" />
        Extraction failed
      </div>
    );
  }

  // Show completion status
  if (extractionStage === 'complete' || verificationPassed !== undefined) {
    if (verificationPassed && (!corrections || corrections.length === 0)) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
            <CheckCircle className="h-4 w-4" />
            Extraction verified successfully
          </div>
          {biomarkerCount !== undefined && biomarkerCount > 0 && (
            <p className="text-xs text-gray-500 pl-1">
              Extracted {biomarkerCount} biomarker{biomarkerCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
      );
    }

    if (corrections && corrections.length > 0) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4" />
            Extraction corrected ({corrections.length} fix{corrections.length > 1 ? 'es' : ''})
          </div>
          {biomarkerCount !== undefined && biomarkerCount > 0 && (
            <p className="text-xs text-gray-500 pl-1">
              Extracted {biomarkerCount} biomarker{biomarkerCount > 1 ? 's' : ''}
            </p>
          )}
          <ul className="text-xs text-gray-600 list-disc list-inside pl-2">
            {corrections.map((correction, i) => (
              <li key={i}>{correction}</li>
            ))}
          </ul>
        </div>
      );
    }
  }

  return null;
}
