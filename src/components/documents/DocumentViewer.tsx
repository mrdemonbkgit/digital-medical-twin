import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Download, AlertCircle } from 'lucide-react';
import { Button, Modal } from '@/components/common';
import { getDocumentUrl } from '@/api/documents';
import { isImageMimeType, DOCUMENT_CATEGORY_LABELS, type Document } from '@/types';

interface DocumentViewerProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!document || !isOpen) {
      setUrl(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    getDocumentUrl(document.storagePath)
      .then(setUrl)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load document');
      })
      .finally(() => setIsLoading(false));
  }, [document, isOpen]);

  if (!document) return null;

  const isImage = isImageMimeType(document.mimeType);
  const isPdf = document.mimeType === 'application/pdf';

  const handleOpenInNewTab = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDownload = () => {
    if (url) {
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.filename;
      link.click();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title={document.title || document.filename}>
      <div className="space-y-4">
        {/* Document metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-theme-secondary">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-theme-tertiary text-theme-secondary font-medium">
            {DOCUMENT_CATEGORY_LABELS[document.category]}
          </span>
          {document.documentDate && (
            <span>Date: {new Date(document.documentDate).toLocaleDateString()}</span>
          )}
          <span>Size: {(document.fileSize / 1024).toFixed(1)} KB</span>
        </div>

        {document.description && (
          <p className="text-sm text-theme-secondary bg-theme-secondary rounded-lg p-3">
            {document.description}
          </p>
        )}

        {/* Content area */}
        <div className="relative bg-theme-tertiary rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-danger">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {url && !isLoading && !error && (
            <>
              {isImage && (
                <img
                  src={url}
                  alt={document.filename}
                  className="max-w-full max-h-[60vh] mx-auto object-contain"
                />
              )}

              {isPdf && (
                <iframe
                  src={url}
                  className="w-full h-[60vh] border-0"
                  title={document.filename}
                />
              )}

              {!isImage && !isPdf && (
                <div className="flex flex-col items-center justify-center py-12 text-theme-tertiary">
                  <p className="text-sm">Preview not available for this file type</p>
                  <Button variant="secondary" size="sm" onClick={handleOpenInNewTab} className="mt-3">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in new tab
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleDownload} disabled={!url}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="secondary" onClick={handleOpenInNewTab} disabled={!url}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in new tab
          </Button>
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
