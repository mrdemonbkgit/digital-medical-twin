import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { createLabUpload, getLabUpload } from '@/api/labUploads';
import { getCorrelationHeaders } from '@/lib/api';
import { useCorrelation } from '@/context/CorrelationContext';
import type { LabUpload, ProcessingStage } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf'];
const POLL_INTERVAL = 2000; // 2 seconds

interface UseLabUploadProcessorReturn {
  uploadAndProcess: (file: File, skipVerification?: boolean) => Promise<LabUpload>;
  isUploading: boolean;
  uploadProgress: number;
  processingUploadId: string | null;
  processingStage: ProcessingStage | null;
  error: string | null;
  clearError: () => void;
}

export function useLabUploadProcessor(): UseLabUploadProcessorReturn {
  const { sessionId, currentOperationId, startOperation, endOperation } = useCorrelation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingUploadId, setProcessingUploadId] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<ProcessingStage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll for processing status
  const startPolling = useCallback((uploadId: string) => {
    const log = logger.child('LabUploadProcessor');

    const poll = async () => {
      try {
        const upload = await getLabUpload(uploadId);
        if (!upload) return;

        if (upload.status === 'processing') {
          setProcessingStage(upload.processingStage || null);
        } else if (upload.status === 'complete' || upload.status === 'failed') {
          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setProcessingUploadId(null);
          setProcessingStage(null);

          if (upload.status === 'failed') {
            setError(upload.errorMessage || 'Processing failed');
          }

          log.info('Processing finished', { uploadId, status: upload.status });
          endOperation();
        }
      } catch (err) {
        log.error('Polling error', err);
      }
    };

    // Initial poll
    poll();

    // Start interval
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL);
  }, [endOperation]);

  // Trigger processing API
  const triggerProcessing = useCallback(async (uploadId: string) => {
    const log = logger.child('LabUploadProcessor');
    log.info('Triggering processing', { uploadId });
    console.log('[DEBUG] triggerProcessing called for:', uploadId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[DEBUG] Got session:', !!session?.access_token);
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      console.log('[DEBUG] Making fetch to /api/ai/process-lab-upload');
      const response = await fetch('/api/ai/process-lab-upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          ...getCorrelationHeaders(sessionId, currentOperationId),
        },
        body: JSON.stringify({ uploadId }),
      });

      console.log('[DEBUG] Fetch response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[DEBUG] Fetch error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Processing started successfully - polling will track progress
      log.info('Processing triggered successfully', { uploadId });
      console.log('[DEBUG] Processing triggered successfully');
    } catch (err) {
      console.error('[DEBUG] triggerProcessing error:', err);
      log.error('Failed to trigger processing', err);
      // Error will be captured by polling or shown directly
      throw err;
    }
  }, [sessionId, currentOperationId]);

  const uploadAndProcess = useCallback(async (
    file: File,
    skipVerification = false
  ): Promise<LabUpload> => {
    const log = logger.child('LabUploadProcessor');
    startOperation('lab-upload-process');

    setError(null);
    setUploadProgress(0);
    log.info('Starting upload and process', { fileName: file.name, fileSize: file.size, skipVerification });

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      const err = 'Only PDF files are allowed';
      setError(err);
      endOperation();
      throw new Error(err);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const err = 'File size must be less than 10MB';
      setError(err);
      endOperation();
      throw new Error(err);
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const err = 'You must be logged in to upload files';
      setError(err);
      endOperation();
      throw new Error(err);
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Generate unique filename
      const fileId = crypto.randomUUID();
      const fileExtension = file.name.split('.').pop() || 'pdf';
      const storagePath = `${user.id}/${fileId}.${fileExtension}`;

      setUploadProgress(30);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('lab-pdfs')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setUploadProgress(70);
      log.info('PDF uploaded to storage', { storagePath });

      // Create lab_uploads record
      const upload = await createLabUpload({
        filename: file.name,
        storagePath,
        fileSize: file.size,
        skipVerification,
      });

      setUploadProgress(100);
      log.info('Upload record created', { uploadId: upload.id });

      setIsUploading(false);
      setProcessingUploadId(upload.id);
      setProcessingStage('fetching_pdf');

      // Start polling for status updates
      startPolling(upload.id);

      // Trigger processing (fire and forget - polling will track progress)
      triggerProcessing(upload.id).catch((err) => {
        log.error('Failed to trigger processing', err);
        setError(err instanceof Error ? err.message : 'Failed to start processing');
      });

      return upload;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setError(message);
      log.error('Upload failed', err, { fileName: file.name });
      endOperation();
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [startOperation, endOperation, startPolling, triggerProcessing]);

  return {
    uploadAndProcess,
    isUploading,
    uploadProgress,
    processingUploadId,
    processingStage,
    error,
    clearError,
  };
}
