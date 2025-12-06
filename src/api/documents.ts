import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type {
  Document,
  DocumentRow,
  DocumentCategory,
  CreateDocumentInput,
  UpdateDocumentInput,
} from '@/types';

// Helper to get authenticated user ID - throws if not authenticated
async function getAuthenticatedUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user.id;
}

// Convert database row to typed Document
function rowToDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    userId: row.user_id,
    filename: row.filename,
    storagePath: row.storage_path,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    category: row.category as DocumentCategory,
    title: row.title,
    description: row.description,
    documentDate: row.document_date,
    labUploadId: row.lab_upload_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert input to database row format
function inputToRow(
  input: CreateDocumentInput,
  userId: string
): Omit<DocumentRow, 'id' | 'created_at' | 'updated_at' | 'lab_upload_id'> {
  return {
    user_id: userId,
    filename: input.filename,
    storage_path: input.storagePath,
    file_size: input.fileSize,
    mime_type: input.mimeType,
    category: input.category,
    title: input.title ?? null,
    description: input.description ?? null,
    document_date: input.documentDate ?? null,
  };
}

// Convert update input to partial database row
function updateToRow(input: UpdateDocumentInput): Partial<DocumentRow> {
  const row: Partial<DocumentRow> = {};

  if (input.category !== undefined) row.category = input.category;
  if (input.title !== undefined) row.title = input.title;
  if (input.description !== undefined) row.description = input.description;
  if (input.documentDate !== undefined) row.document_date = input.documentDate;
  if (input.labUploadId !== undefined) row.lab_upload_id = input.labUploadId;

  return row;
}

// Get all documents for the current user
export async function getDocuments(category?: DocumentCategory): Promise<Document[]> {
  const userId = await getAuthenticatedUserId();

  let query = supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return (data as DocumentRow[]).map(rowToDocument);
}

// Get a single document by ID (scoped to current user)
export async function getDocument(id: string): Promise<Document | null> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found or not owned by current user
    }
    throw new Error(`Failed to fetch document: ${error.message}`);
  }

  return rowToDocument(data as DocumentRow);
}

// Create a new document record
export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  const userId = await getAuthenticatedUserId();
  const row = inputToRow(input, userId);

  const { data, error } = await supabase
    .from('documents')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create document: ${error.message}`);
  }

  return rowToDocument(data as DocumentRow);
}

// Update an existing document (scoped to current user)
export async function updateDocument(
  id: string,
  input: UpdateDocumentInput
): Promise<Document> {
  const userId = await getAuthenticatedUserId();
  const row = updateToRow(input);

  const { data, error } = await supabase
    .from('documents')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update document: ${error.message}`);
  }

  return rowToDocument(data as DocumentRow);
}

// Delete a document (also deletes the file from storage, scoped to current user)
export async function deleteDocument(id: string): Promise<void> {
  const userId = await getAuthenticatedUserId();

  // First get the document to get the storage path (also verifies ownership)
  const doc = await getDocument(id);
  if (!doc) {
    throw new Error('Document not found');
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([doc.storagePath]);

  if (storageError) {
    logger.error('Failed to delete file from storage', storageError);
    // Continue with database deletion even if storage fails
  }

  // Delete from database (explicit user_id check for defense in depth)
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

// Generate a signed URL for viewing the document (verifies ownership first)
export async function getDocumentUrl(storagePath: string): Promise<string> {
  const userId = await getAuthenticatedUserId();

  // Verify the current user owns a document with this storage path
  const { data: doc, error: verifyError } = await supabase
    .from('documents')
    .select('id')
    .eq('storage_path', storagePath)
    .eq('user_id', userId)
    .maybeSingle();

  if (verifyError) {
    throw new Error(`Failed to verify document ownership: ${verifyError.message}`);
  }

  if (!doc) {
    throw new Error('Document not found or access denied');
  }

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error) {
    throw new Error(`Failed to generate document URL: ${error.message}`);
  }

  return data.signedUrl;
}

// Get document counts by category for the current user
export async function getDocumentCounts(): Promise<Record<DocumentCategory, number>> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('documents')
    .select('category')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch document counts: ${error.message}`);
  }

  // Count documents by category
  const counts: Record<string, number> = {
    labs: 0,
    prescriptions: 0,
    imaging: 0,
    discharge_summaries: 0,
    insurance: 0,
    referrals: 0,
    other: 0,
  };

  for (const row of data) {
    if (row.category in counts) {
      counts[row.category]++;
    }
  }

  return counts as Record<DocumentCategory, number>;
}
