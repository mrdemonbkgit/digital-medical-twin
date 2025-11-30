import { supabase } from '@/lib/supabase';
import type {
  LabUpload,
  LabUploadRow,
  CreateLabUploadInput,
  UpdateLabUploadInput,
} from '@/types';

// Convert database row to typed LabUpload
function rowToLabUpload(row: LabUploadRow): LabUpload {
  return {
    id: row.id,
    userId: row.user_id,
    filename: row.filename,
    storagePath: row.storage_path,
    fileSize: row.file_size,
    status: row.status,
    processingStage: row.processing_stage || undefined,
    skipVerification: row.skip_verification,
    extractedData: row.extracted_data || undefined,
    extractionConfidence: row.extraction_confidence || undefined,
    verificationPassed: row.verification_passed ?? undefined,
    corrections: row.corrections || undefined,
    errorMessage: row.error_message || undefined,
    createdAt: row.created_at,
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined,
    eventId: row.event_id || undefined,
    currentPage: row.current_page || undefined,
    totalPages: row.total_pages || undefined,
  };
}

// Convert input to database row format
function inputToRow(
  input: CreateLabUploadInput,
  userId: string
): Omit<LabUploadRow, 'id' | 'created_at' | 'started_at' | 'completed_at' | 'event_id' | 'extracted_data' | 'extraction_confidence' | 'verification_passed' | 'corrections' | 'error_message' | 'processing_stage' | 'current_page' | 'total_pages'> {
  return {
    user_id: userId,
    filename: input.filename,
    storage_path: input.storagePath,
    file_size: input.fileSize,
    status: 'pending',
    skip_verification: input.skipVerification ?? false,
  };
}

// Convert update input to partial database row
function updateToRow(input: UpdateLabUploadInput): Partial<LabUploadRow> {
  const row: Partial<LabUploadRow> = {};

  if (input.status !== undefined) row.status = input.status;
  if (input.processingStage !== undefined) row.processing_stage = input.processingStage;
  if (input.extractedData !== undefined) row.extracted_data = input.extractedData;
  if (input.extractionConfidence !== undefined) row.extraction_confidence = input.extractionConfidence;
  if (input.verificationPassed !== undefined) row.verification_passed = input.verificationPassed;
  if (input.corrections !== undefined) row.corrections = input.corrections;
  if (input.errorMessage !== undefined) row.error_message = input.errorMessage;
  if (input.startedAt !== undefined) row.started_at = input.startedAt;
  if (input.completedAt !== undefined) row.completed_at = input.completedAt;
  if (input.eventId !== undefined) row.event_id = input.eventId;
  if (input.currentPage !== undefined) row.current_page = input.currentPage;
  if (input.totalPages !== undefined) row.total_pages = input.totalPages;

  return row;
}

// Get all lab uploads for the current user
export async function getLabUploads(): Promise<LabUpload[]> {
  const { data, error } = await supabase
    .from('lab_uploads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lab uploads: ${error.message}`);
  }

  return (data as LabUploadRow[]).map(rowToLabUpload);
}

// Get a single lab upload by ID
export async function getLabUpload(id: string): Promise<LabUpload | null> {
  const { data, error } = await supabase
    .from('lab_uploads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch lab upload: ${error.message}`);
  }

  return rowToLabUpload(data as LabUploadRow);
}

// Create a new lab upload record
export async function createLabUpload(input: CreateLabUploadInput): Promise<LabUpload> {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const row = inputToRow(input, user.id);

  const { data, error } = await supabase
    .from('lab_uploads')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lab upload: ${error.message}`);
  }

  return rowToLabUpload(data as LabUploadRow);
}

// Update an existing lab upload
export async function updateLabUpload(
  id: string,
  input: UpdateLabUploadInput
): Promise<LabUpload> {
  const row = updateToRow(input);

  const { data, error } = await supabase
    .from('lab_uploads')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update lab upload: ${error.message}`);
  }

  return rowToLabUpload(data as LabUploadRow);
}

// Delete a lab upload (also deletes the PDF from storage)
export async function deleteLabUpload(id: string): Promise<void> {
  // First get the upload to get the storage path
  const upload = await getLabUpload(id);
  if (!upload) {
    throw new Error('Lab upload not found');
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('lab-pdfs')
    .remove([upload.storagePath]);

  if (storageError) {
    console.error('Failed to delete file from storage:', storageError);
    // Continue with database deletion even if storage fails
  }

  // Delete from database
  const { error } = await supabase
    .from('lab_uploads')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete lab upload: ${error.message}`);
  }
}

// Get the next pending upload (for sequential processing)
export async function getNextPendingUpload(): Promise<LabUpload | null> {
  const { data, error } = await supabase
    .from('lab_uploads')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No pending uploads
    }
    throw new Error(`Failed to fetch pending upload: ${error.message}`);
  }

  return rowToLabUpload(data as LabUploadRow);
}

// Check if any upload is currently processing
export async function hasProcessingUpload(): Promise<boolean> {
  const { data, error } = await supabase
    .from('lab_uploads')
    .select('id')
    .eq('status', 'processing')
    .limit(1);

  if (error) {
    throw new Error(`Failed to check processing status: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}

// Generate a signed URL for viewing the PDF
export async function getLabUploadPdfUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('lab-pdfs')
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error) {
    throw new Error(`Failed to generate PDF URL: ${error.message}`);
  }

  return data.signedUrl;
}
