import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { LabResultAttachment } from '@/types/events';

interface UsePDFUploadReturn {
  uploadPDF: (file: File) => Promise<LabResultAttachment>;
  deletePDF: (storagePath: string) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  clearError: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

export function usePDFUpload(): UsePDFUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadPDF = useCallback(async (file: File): Promise<LabResultAttachment> => {
    setError(null);
    setUploadProgress(0);

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      const err = 'Only PDF files are allowed';
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

      // Get signed URL for viewing (valid for 1 hour)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('lab-pdfs')
        .createSignedUrl(storagePath, 3600);

      if (urlError || !urlData?.signedUrl) {
        throw new Error('Failed to generate file URL');
      }

      setUploadProgress(100);

      const attachment: LabResultAttachment = {
        id: fileId,
        filename: file.name,
        url: urlData.signedUrl,
        storagePath,
        uploadedAt: new Date().toISOString(),
      };

      return attachment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const deletePDF = useCallback(async (storagePath: string): Promise<void> => {
    setError(null);

    try {
      const { error: deleteError } = await supabase.storage
        .from('lab-pdfs')
        .remove([storagePath]);

      if (deleteError) {
        throw new Error(deleteError.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete file';
      setError(message);
      throw err;
    }
  }, []);

  return {
    uploadPDF,
    deletePDF,
    isUploading,
    uploadProgress,
    error,
    clearError,
  };
}
