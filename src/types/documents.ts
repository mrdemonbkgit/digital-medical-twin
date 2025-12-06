// Document categories
export const DOCUMENT_CATEGORIES = [
  'labs',
  'prescriptions',
  'imaging',
  'discharge_summaries',
  'insurance',
  'referrals',
  'other',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  labs: 'Labs',
  prescriptions: 'Prescriptions',
  imaging: 'Imaging',
  discharge_summaries: 'Discharge Summaries',
  insurance: 'Insurance',
  referrals: 'Referrals',
  other: 'Other',
};

// Category icons for UI (using lucide-react icon names)
export const DOCUMENT_CATEGORY_ICONS: Record<DocumentCategory, string> = {
  labs: 'TestTube2',
  prescriptions: 'Pill',
  imaging: 'ScanLine',
  discharge_summaries: 'FileText',
  insurance: 'Shield',
  referrals: 'Send',
  other: 'File',
};

// Allowed MIME types
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
] as const;

export type DocumentMimeType = (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];

// Check if a MIME type is an image
export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// Check if a document can be sent for lab extraction
export function canExtractLabData(doc: Document): boolean {
  return doc.category === 'labs' && doc.mimeType === 'application/pdf' && !doc.labUploadId;
}

// Main document entity
export interface Document {
  id: string;
  userId: string;
  filename: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  category: DocumentCategory;
  title: string | null;
  description: string | null;
  documentDate: string | null; // ISO date string (YYYY-MM-DD)
  labUploadId: string | null; // Set if sent for lab extraction
  createdAt: string;
  updatedAt: string;
}

// Input for creating a document
export interface CreateDocumentInput {
  filename: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  category: DocumentCategory;
  title?: string;
  description?: string;
  documentDate?: string;
}

// Input for updating a document
export interface UpdateDocumentInput {
  category?: DocumentCategory;
  title?: string | null;
  description?: string | null;
  documentDate?: string | null;
  labUploadId?: string | null;
}

// Database row shape (snake_case)
export interface DocumentRow {
  id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  category: string;
  title: string | null;
  description: string | null;
  document_date: string | null;
  lab_upload_id: string | null;
  created_at: string;
  updated_at: string;
}
