import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Image as ImageIcon,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  TestTube2,
} from 'lucide-react';
import { Button } from '@/components/common';
import { useSendToLabUploads } from '@/hooks/useSendToLabUploads';
import {
  canExtractLabData,
  isImageMimeType,
  type Document,
  type DocumentCategory,
} from '@/types';

const categoryColors: Record<DocumentCategory, string> = {
  labs: 'border-l-red-400',
  prescriptions: 'border-l-green-400',
  imaging: 'border-l-purple-400',
  discharge_summaries: 'border-l-orange-400',
  insurance: 'border-l-blue-400',
  referrals: 'border-l-cyan-400',
  other: 'border-l-theme-muted',
};

interface DocumentCardProps {
  document: Document;
  onEdit: (document: Document) => void;
  onDelete: (id: string) => Promise<void>;
  onView: (document: Document) => void;
  isDeleting?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DocumentCard({
  document,
  onEdit,
  onDelete,
  onView,
  isDeleting = false,
}: DocumentCardProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const { sendToLabUploads, error: extractError, clearError } = useSendToLabUploads();

  const isImage = isImageMimeType(document.mimeType);
  const canExtract = canExtractLabData(document);
  const hasExtraction = !!document.labUploadId;

  const handleExtract = async () => {
    if (isExtracting) return;
    clearError();
    setIsExtracting(true);

    try {
      await sendToLabUploads(document);
    } catch {
      // Error handled by hook
    } finally {
      setIsExtracting(false);
    }
  };

  const FileIcon = isImage ? ImageIcon : FileText;

  return (
    <div className={`border border-theme-primary rounded-lg bg-theme-primary border-l-4 ${categoryColors[document.category]} hover:shadow-md transition-shadow`}>
      {/* Header with icon and actions */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isImage ? 'bg-purple-100' : 'bg-info-muted'
        }`}>
          <FileIcon className={`h-5 w-5 ${isImage ? 'text-purple-600' : 'text-info'}`} />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(document)}
            className="h-9 w-9 p-0"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(document)}
            className="h-9 w-9 p-0"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(document.id)}
            disabled={isDeleting}
            className="h-9 w-9 p-0 text-theme-muted hover:text-danger"
            title="Delete"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content - full width */}
      <div className="px-4 pb-4">
        <h3 className="font-medium text-theme-primary line-clamp-2 leading-snug">
          {document.title || document.filename}
        </h3>
        {document.title && (
          <p className="text-sm text-theme-tertiary truncate mt-1">{document.filename}</p>
        )}
        <p className="text-sm text-theme-tertiary mt-1">
          {formatFileSize(document.fileSize)}
          {document.documentDate && ` • ${formatDate(document.documentDate)}`}
        </p>
      </div>

      {/* Lab extraction section */}
      {(canExtract || hasExtraction) && (
        <div className="px-4 pb-4 pt-3 border-t border-theme-primary">
          {canExtract && !hasExtraction && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExtract}
              disabled={isExtracting}
              className="w-full"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending for extraction...
                </>
              ) : (
                <>
                  <TestTube2 className="h-4 w-4 mr-2" />
                  Extract Biomarkers
                </>
              )}
            </Button>
          )}

          {hasExtraction && (
            <Link to="/lab-uploads" className="block">
              <Button variant="secondary" size="sm" className="w-full">
                <TestTube2 className="h-4 w-4 mr-2" />
                View Extraction Results
              </Button>
            </Link>
          )}

          {extractError && (
            <p className="mt-2 text-xs text-danger">{extractError}</p>
          )}
        </div>
      )}
    </div>
  );
}
