import { useCallback, useRef, useState } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { useLabUploadProcessor } from '@/hooks/useLabUploadProcessor';

interface LabUploadDropzoneProps {
  onUploadComplete?: () => void;
  disabled?: boolean;
}

export function LabUploadDropzone({ onUploadComplete, disabled = false }: LabUploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [skipVerification, setSkipVerification] = useState(false);

  const {
    uploadAndProcess,
    isUploading,
    uploadProgress,
    error,
    clearError,
  } = useLabUploadProcessor();

  // Only block during upload, not during processing
  // Processing continues in background and is shown in the uploads list
  const isBusy = isUploading;

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled || isBusy) return;
      clearError();

      try {
        await uploadAndProcess(file, skipVerification);
        onUploadComplete?.();
      } catch {
        // Error is handled by the hook
      }
    },
    [disabled, isBusy, skipVerification, uploadAndProcess, clearError, onUploadComplete]
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

  const handleClick = useCallback(() => {
    if (!disabled && !isBusy) {
      fileInputRef.current?.click();
    }
  }, [disabled, isBusy]);


  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isBusy}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'border-blue-500 bg-info-muted' : 'border-theme-primary hover:border-theme-secondary'}
          ${disabled || isBusy ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isUploading ? (
          <div className="space-y-3">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
            <p className="text-sm text-theme-secondary">Uploading... {uploadProgress}%</p>
            <div className="w-full bg-theme-tertiary rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 text-theme-muted mx-auto mb-3" />
            <p className="text-sm text-theme-secondary">
              <span className="font-medium text-info">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-theme-tertiary mt-1">PDF files only (max 10MB)</p>
          </>
        )}
      </div>

      {/* Skip verification checkbox */}
      <label className="flex items-center gap-2 text-sm text-theme-secondary cursor-pointer">
        <input
          type="checkbox"
          checked={skipVerification}
          onChange={(e) => setSkipVerification(e.target.checked)}
          disabled={disabled || isBusy}
          className="rounded border-theme-primary text-info focus:ring-blue-500"
        />
        <span>Skip GPT verification (faster, but may have errors)</span>
      </label>

      {error && (
        <div className="flex items-center gap-2 text-sm text-danger bg-danger-muted rounded-lg px-3 py-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
