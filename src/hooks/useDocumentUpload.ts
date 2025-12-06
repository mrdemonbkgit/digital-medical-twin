import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { createDocument } from '@/api/documents';
import type { Document, DocumentCategory, ALLOWED_DOCUMENT_MIME_TYPES } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES: string[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
];

interface DocumentMetadata {
  title?: string;
  description?: string;
  documentDate?: string;
}

interface UseDocumentUploadReturn {
  upload: (file: File, category: DocumentCategory, metadata?: DocumentMetadata) => Promise<Document>;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  clearError: () => void;
}

export function useDocumentUpload(): UseDocumentUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const upload = useCallback(async (
    file: File,
    category: DocumentCategory,
    metadata?: DocumentMetadata
  ): Promise<Document> => {
    const log = logger.child('DocumentUpload');
    setError(null);
    setUploadProgress(0);

    log.info('Starting document upload', {
      fileName: file.name,
      fileSize: file.size,
      category,
      mimeType: file.type
    });

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      const err = 'Only PDF and image files (JPG, PNG, HEIC) are allowed';
      setError(err);
      throw new Error(err);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const err = 'File size must be less than 10MB';
      setError(err);
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
      throw new Error(err);
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Generate unique filename
      const fileId = crypto.randomUUID();
      const fileExtension = file.name.split('.').pop() || 'bin';
      const storagePath = `${user.id}/${fileId}.${fileExtension}`;

      setUploadProgress(30);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setUploadProgress(70);
      log.info('Document uploaded to storage', { storagePath });

      // Create documents record
      const doc = await createDocument({
        filename: file.name,
        storagePath,
        fileSize: file.size,
        mimeType: file.type as typeof ALLOWED_DOCUMENT_MIME_TYPES[number],
        category,
        title: metadata?.title,
        description: metadata?.description,
        documentDate: metadata?.documentDate,
      });

      setUploadProgress(100);
      log.info('Document record created', { documentId: doc.id });

      return doc;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setError(message);
      log.error('Upload failed', err, { fileName: file.name });
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    upload,
    isUploading,
    uploadProgress,
    error,
    clearError,
  };
}
