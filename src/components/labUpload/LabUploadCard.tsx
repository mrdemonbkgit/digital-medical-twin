import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/common';
import { getLabUploadPdfUrl } from '@/api/labUploads';
import { logger } from '@/lib/logger';
import type { LabUpload, ProcessingStage } from '@/types';

interface LabUploadCardProps {
  upload: LabUpload;
  onDelete: (id: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
  onPreview: (upload: LabUpload) => void;
  isDeleting?: boolean;
}

const stageMessages: Record<ProcessingStage, string> = {
  fetching_pdf: 'Fetching PDF...',
  splitting_pages: 'Splitting PDF into pages...',
  extracting_gemini: 'Extracting with Gemini...',
  verifying_gpt: 'Verifying with GPT...',
  post_processing: 'Matching biomarkers to standards...',
};

// Hook to track elapsed time
function useElapsedTime(startTime?: string, isActive?: boolean) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime || !isActive) {
      setElapsed(0);
      return;
    }

    const start = new Date(startTime).getTime();
    setElapsed(Math.floor((Date.now() - start) / 1000));

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive]);

  return elapsed;
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Allow deleting stuck jobs after 20 minutes
const STUCK_JOB_THRESHOLD_SECONDS = 1200;

export function LabUploadCard({
  upload,
  onDelete,
  onRetry,
  onPreview,
  isDeleting = false,
}: LabUploadCardProps) {
  const isProcessing = upload.status === 'processing';
  const elapsed = useElapsedTime(upload.startedAt, isProcessing);

  // Allow delete if job is stuck (processing for more than 5 minutes)
  const isStuck = isProcessing && elapsed > STUCK_JOB_THRESHOLD_SECONDS;
  const canDelete = !isProcessing || isStuck;

  const handleViewPdf = async () => {
    try {
      const url = await getLabUploadPdfUrl(upload.storagePath);
      window.open(url, '_blank');
    } catch (err) {
      logger.error('Failed to get PDF URL', err);
    }
  };

  const getStatusBadge = () => {
    switch (upload.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-theme-tertiary text-theme-secondary">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-info-muted text-info">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </span>
        );
      case 'complete':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success-muted text-success">
            <CheckCircle className="h-3 w-3" />
            Complete
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning-muted text-warning">
            <AlertCircle className="h-3 w-3" />
            Partial
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-danger-muted text-danger">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="border border-theme-primary rounded-lg p-4 bg-theme-primary hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* File info */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-info-muted rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-info" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-theme-primary truncate">
              {upload.filename}
            </p>
            <p className="text-xs text-theme-tertiary">
              {formatFileSize(upload.fileSize)} • {new Date(upload.createdAt).toLocaleDateString()}
            </p>
            {getStatusBadge()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewPdf}
            title="View PDF"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(upload.id)}
            disabled={isDeleting || !canDelete}
            className="text-theme-muted hover:text-danger"
            title={isStuck ? 'Delete stuck job' : 'Delete'}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Processing progress */}
      {isProcessing && (
        <div className={`mt-3 space-y-2 text-sm rounded-lg px-3 py-2 ${
          isStuck ? 'text-warning bg-warning-muted' : 'text-info bg-info-muted'
        }`}>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="flex-1">
              {isStuck
                ? 'Job appears stuck - you can delete and retry'
                : upload.processingStage ? stageMessages[upload.processingStage] : 'Processing...'}
            </span>
            {upload.startedAt && (
              <span className={`font-mono text-xs ${isStuck ? 'text-amber-500' : 'text-blue-500'}`}>
                {formatElapsed(elapsed)}
              </span>
            )}
          </div>
          {/* Page progress bar for chunked extraction */}
          {upload.totalPages && upload.totalPages > 1 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>
                  Page {upload.currentPage || 1} of {upload.totalPages}
                </span>
                <span>
                  {Math.round(((upload.currentPage || 1) / upload.totalPages) * 100)}%
                </span>
              </div>
              <div className={`w-full h-1.5 rounded-full ${isStuck ? 'bg-amber-200' : 'bg-blue-200'}`}>
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${isStuck ? 'bg-amber-500' : 'bg-blue-500'}`}
                  style={{ width: `${((upload.currentPage || 1) / upload.totalPages) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Failed state */}
      {upload.status === 'failed' && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-danger bg-danger-muted rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{upload.errorMessage || 'Extraction failed'}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRetry(upload.id)}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Extraction
          </Button>
        </div>
      )}

      {/* Complete or partial state */}
      {(upload.status === 'complete' || upload.status === 'partial') && upload.extractedData && (
        <div className="mt-3 space-y-2">
          {/* Extraction summary */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-theme-secondary">
              {upload.extractedData.biomarkers.length} biomarker{upload.extractedData.biomarkers.length !== 1 ? 's' : ''} extracted
            </span>
            {upload.verificationPassed ? (
              <span className="text-success flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            ) : upload.status === 'partial' ? (
              <span className="text-warning flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Needs review
              </span>
            ) : (
              <span className="text-warning flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Unverified
              </span>
            )}
          </div>

          {/* Corrections */}
          {upload.corrections && upload.corrections.length > 0 && (
            <div className="text-xs text-theme-tertiary bg-theme-secondary rounded px-2 py-1">
              {upload.corrections.length} correction{upload.corrections.length !== 1 ? 's' : ''} applied
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPreview(upload)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry(upload.id)}
              title="Re-extract data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {upload.eventId ? (
              <Link to={`/event/${upload.eventId}`} className="flex-1">
                <Button variant="primary" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Event
                </Button>
              </Link>
            ) : (
              <Link
                to={`/event/new/lab_result?fromUpload=${upload.id}`}
                className="flex-1"
              >
                <Button variant="primary" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
