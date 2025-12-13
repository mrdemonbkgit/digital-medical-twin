import { useState } from 'react';
import { FileText } from 'lucide-react';
import { LabUploadCard } from './LabUploadCard';
import { ExtractionPreview } from './ExtractionPreview';
import { useLabUploads } from '@/hooks/useLabUploads';
import { useLabUploadMutation } from '@/hooks/useLabUploadMutation';
import { LoadingSpinner } from '@/components/common';
import { supabase } from '@/lib/supabase';
import { getCorrelationHeaders } from '@/lib/api';
import { useCorrelation } from '@/context/CorrelationContext';
import { logger } from '@/lib/logger';
import type { LabUpload } from '@/types';

interface LabUploadListProps {
  onRefetchRef?: (refetch: () => Promise<void>) => void;
}

export function LabUploadList({ onRefetchRef }: LabUploadListProps) {
  const { sessionId, currentOperationId } = useCorrelation();
  // The hook handles polling internally - only polls when hasProcessing is true
  const { uploads, isLoading, error, refetch } = useLabUploads({
    pollInterval: 2000,
  });

  // Expose refetch to parent via callback ref
  if (onRefetchRef) {
    onRefetchRef(refetch);
  }
  const { remove, update, isDeleting } = useLabUploadMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [_retryingId, setRetryingId] = useState<string | null>(null);
  const [previewUpload, setPreviewUpload] = useState<LabUpload | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await remove(id);
      await refetch();
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      // Reset status to pending
      await update(id, {
        status: 'pending',
        processingStage: null,
        extractedData: null,
        extractionConfidence: null,
        verificationPassed: null,
        corrections: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
      });

      // Trigger processing
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        fetch('/api/ai/process-lab-upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            ...getCorrelationHeaders(sessionId, currentOperationId),
          },
          body: JSON.stringify({ uploadId: id }),
        }).catch((err) => logger.error('Failed to trigger retry processing', err));
      }

      await refetch();
    } catch (err) {
      logger.error('Retry failed', err);
    } finally {
      setRetryingId(null);
    }
  };

  const handlePreview = (upload: LabUpload) => {
    setPreviewUpload(upload);
  };

  const handleClosePreview = () => {
    setPreviewUpload(null);
  };

  if (isLoading && uploads.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">{error}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-info hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-theme-muted" />
        </div>
        <h3 className="text-lg font-medium text-theme-primary mb-1">No uploads yet</h3>
        <p className="text-theme-tertiary">
          Upload a lab result PDF above to get started
        </p>
      </div>
    );
  }

  // Group uploads by status
  const processing = uploads.filter((u) => u.status === 'processing');
  const pending = uploads.filter((u) => u.status === 'pending');
  const complete = uploads.filter((u) => u.status === 'complete');
  const partial = uploads.filter((u) => u.status === 'partial');
  const failed = uploads.filter((u) => u.status === 'failed');

  return (
    <>
      <div className="space-y-6">
        {/* Processing */}
        {processing.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-theme-secondary mb-3">Processing</h3>
            <div className="space-y-3">
              {processing.map((upload) => (
                <LabUploadCard
                  key={upload.id}
                  upload={upload}
                  onDelete={handleDelete}
                  onRetry={handleRetry}
                  onPreview={handlePreview}
                  isDeleting={deletingId === upload.id && isDeleting}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-theme-secondary mb-3">Pending</h3>
            <div className="space-y-3">
              {pending.map((upload) => (
                <LabUploadCard
                  key={upload.id}
                  upload={upload}
                  onDelete={handleDelete}
                  onRetry={handleRetry}
                  onPreview={handlePreview}
                  isDeleting={deletingId === upload.id && isDeleting}
                />
              ))}
            </div>
          </div>
        )}

        {/* Partial (extraction succeeded but post-processing failed) */}
        {partial.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-theme-secondary mb-3">Needs Review (Partial)</h3>
            <div className="space-y-3">
              {partial.map((upload) => (
                <LabUploadCard
                  key={upload.id}
                  upload={upload}
                  onDelete={handleDelete}
                  onRetry={handleRetry}
                  onPreview={handlePreview}
                  isDeleting={deletingId === upload.id && isDeleting}
                />
              ))}
            </div>
          </div>
        )}

        {/* Failed */}
        {failed.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-theme-secondary mb-3">Failed</h3>
            <div className="space-y-3">
              {failed.map((upload) => (
                <LabUploadCard
                  key={upload.id}
                  upload={upload}
                  onDelete={handleDelete}
                  onRetry={handleRetry}
                  onPreview={handlePreview}
                  isDeleting={deletingId === upload.id && isDeleting}
                />
              ))}
            </div>
          </div>
        )}

        {/* Complete */}
        {complete.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-theme-secondary mb-3">
              Completed ({complete.length})
            </h3>
            <div className="space-y-3">
              {complete.map((upload) => (
                <LabUploadCard
                  key={upload.id}
                  upload={upload}
                  onDelete={handleDelete}
                  onRetry={handleRetry}
                  onPreview={handlePreview}
                  isDeleting={deletingId === upload.id && isDeleting}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewUpload && (
        <ExtractionPreview
          upload={previewUpload}
          onClose={handleClosePreview}
        />
      )}
    </>
  );
}
