import { useCallback, useRef, useState } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { Select, Input } from '@/components/common';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from '@/types';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
];

const ACCEPT_STRING = '.pdf,.jpg,.jpeg,.png,.heic';

interface DocumentUploadDropzoneProps {
  onUploadComplete?: () => void;
  defaultCategory?: DocumentCategory;
  disabled?: boolean;
}

const categoryOptions = DOCUMENT_CATEGORIES.map((cat) => ({
  value: cat,
  label: DOCUMENT_CATEGORY_LABELS[cat],
}));

export function DocumentUploadDropzone({
  onUploadComplete,
  defaultCategory = 'other',
  disabled = false,
}: DocumentUploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [category, setCategory] = useState<DocumentCategory>(defaultCategory);
  const [title, setTitle] = useState('');
  const [documentDate, setDocumentDate] = useState('');

  const {
    upload,
    isUploading,
    uploadProgress,
    error,
    clearError,
  } = useDocumentUpload();

  const isBusy = isUploading;

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled || isBusy) return;
      clearError();

      try {
        await upload(file, category, {
          title: title.trim() || undefined,
          documentDate: documentDate || undefined,
        });
        // Reset form after successful upload
        setTitle('');
        setDocumentDate('');
        onUploadComplete?.();
      } catch {
        // Error is handled by the hook
      }
    },
    [disabled, isBusy, category, title, documentDate, upload, clearError, onUploadComplete]
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
      if (file && ALLOWED_TYPES.includes(file.type)) {
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
    <div className="space-y-4">
      {/* Category and metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          options={categoryOptions}
          disabled={disabled || isBusy}
        />
        <Input
          label="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Blood Test Results"
          disabled={disabled || isBusy}
        />
        <Input
          type="date"
          label="Document Date (optional)"
          value={documentDate}
          onChange={(e) => setDocumentDate(e.target.value)}
          disabled={disabled || isBusy}
        />
      </div>

      {/* Dropzone */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_STRING}
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
            <Loader2 className="h-10 w-10 text-accent animate-spin mx-auto" />
            <p className="text-sm text-theme-secondary">Uploading... {uploadProgress}%</p>
            <div className="w-full bg-theme-tertiary rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-300"
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
            <p className="text-xs text-theme-tertiary mt-1">PDF or images (JPG, PNG, HEIC) up to 10MB</p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-danger bg-danger-muted rounded-lg px-3 py-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
