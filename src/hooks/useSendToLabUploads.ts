import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { createLabUpload } from '@/api/labUploads';
import { updateDocument } from '@/api/documents';
import { getCorrelationHeaders } from '@/lib/api';
import { useCorrelation } from '@/context/CorrelationContext';
import type { Document, LabUpload } from '@/types';

interface UseSendToLabUploadsReturn {
  sendToLabUploads: (document: Document, skipVerification?: boolean) => Promise<LabUpload>;
  isSending: boolean;
  error: string | null;
  clearError: () => void;
}

export function useSendToLabUploads(): UseSendToLabUploadsReturn {
  const { sessionId, currentOperationId, startOperation, endOperation } = useCorrelation();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendToLabUploads = useCallback(async (
    document: Document,
    skipVerification = false
  ): Promise<LabUpload> => {
    const log = logger.child('SendToLabUploads');
    startOperation('send-to-lab-uploads');

    setError(null);
    setIsSending(true);

    log.info('Sending document to Lab Uploads', {
      documentId: document.id,
      filename: document.filename,
      skipVerification
    });

    try {
      // Validate document type
      if (document.category !== 'labs') {
        throw new Error('Only documents in the "Labs" category can be sent for extraction');
      }

      if (document.mimeType !== 'application/pdf') {
        throw new Error('Only PDF files can be sent for extraction');
      }

      if (document.labUploadId) {
        throw new Error('This document has already been sent for extraction');
      }

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('You must be logged in');
      }

      // Download the file from documents bucket
      log.info('Downloading document from storage', { storagePath: document.storagePath });
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(document.storagePath);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download document: ${downloadError?.message || 'Unknown error'}`);
      }

      // Generate new path for lab-pdfs bucket
      const fileId = crypto.randomUUID();
      const newStoragePath = `${user.id}/${fileId}.pdf`;

      // Upload to lab-pdfs bucket
      log.info('Uploading to lab-pdfs bucket', { newStoragePath });
      const { error: uploadError } = await supabase.storage
        .from('lab-pdfs')
        .upload(newStoragePath, fileData, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to copy to lab storage: ${uploadError.message}`);
      }

      // Create lab_uploads record
      log.info('Creating lab upload record');
      const labUpload = await createLabUpload({
        filename: document.filename,
        storagePath: newStoragePath,
        fileSize: document.fileSize,
        skipVerification,
      });

      // Link document to lab_upload
      log.info('Linking document to lab upload', { labUploadId: labUpload.id });
      await updateDocument(document.id, {
        labUploadId: labUpload.id,
      });

      // Trigger processing
      log.info('Triggering extraction processing', { uploadId: labUpload.id });
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        try {
          const response = await fetch('/api/ai/process-lab-upload', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              ...getCorrelationHeaders(sessionId, currentOperationId),
            },
            body: JSON.stringify({ uploadId: labUpload.id }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            log.warn('Failed to trigger processing', { error: errorData });
            // Don't throw - the lab upload was created successfully
            // User can check status on the Lab Uploads page
          } else {
            log.info('Processing triggered successfully');
          }
        } catch (triggerErr) {
          log.warn('Failed to trigger processing', { error: triggerErr instanceof Error ? triggerErr.message : 'Unknown error' });
          // Don't throw - the lab upload was created successfully
        }
      }

      endOperation();
      log.info('Document sent to Lab Uploads successfully', {
        documentId: document.id,
        labUploadId: labUpload.id
      });

      return labUpload;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send to Lab Uploads';
      setError(message);
      log.error('Failed to send to Lab Uploads', err, { documentId: document.id });
      endOperation();
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [sessionId, currentOperationId, startOperation, endOperation]);

  return {
    sendToLabUploads,
    isSending,
    error,
    clearError,
  };
}
