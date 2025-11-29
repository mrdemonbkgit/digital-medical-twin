import type { Biomarker } from './events';

// Upload status lifecycle
export type LabUploadStatus = 'pending' | 'processing' | 'complete' | 'failed';

// Processing stages for progress tracking
export type ProcessingStage = 'fetching_pdf' | 'extracting_gemini' | 'verifying_gpt' | 'post_processing';

// Debug information for extraction process
export interface ExtractionDebugInfo {
  // Overall metrics
  totalDurationMs: number;
  pdfSizeBytes: number;

  // Stage 1: Gemini Extraction
  stage1: {
    name: 'Gemini Extraction';
    startedAt: string;
    completedAt: string;
    durationMs: number;
    biomarkersExtracted: number;
    rawResponse: string; // Truncated if too large
    model: string;
    thinkingLevel: string;
  };

  // Stage 2: GPT Verification
  stage2: {
    name: 'GPT Verification';
    skipped: boolean;
    startedAt?: string;
    completedAt?: string;
    durationMs?: number;
    verificationPassed?: boolean;
    correctionsCount: number;
    corrections: string[];
    rawResponse?: string;
    model?: string;
    reasoningEffort?: string;
  };

  // Stage 3: Post-Processing
  stage3: {
    name: 'Biomarker Matching';
    startedAt: string;
    completedAt: string;
    durationMs: number;
    standardsCount: number;
    matchedCount: number;
    unmatchedCount: number;
    userGender: 'male' | 'female';
    rawResponse: string;
    matchDetails: BiomarkerMatchDetail[];
  };
}

// Per-biomarker matching details for debugging
export interface BiomarkerMatchDetail {
  originalName: string;
  matchedCode: string | null;
  matchedName: string | null;
  confidence?: number;
  conversionApplied?: {
    fromValue: number;
    fromUnit: string;
    toValue: number;
    toUnit: string;
    factor: number;
  };
  validationIssues: string[];
}

// Processed biomarker - matched to standard with converted values
export interface ProcessedBiomarker {
  // Original extracted data
  originalName: string;
  originalValue: number;
  originalUnit: string;
  // Matched standard (null if unmatched)
  standardCode: string | null;
  standardName: string | null;
  // Converted value in standard unit
  standardValue: number | null;
  standardUnit: string | null;
  // Reference range (gender-specific from standards)
  referenceMin: number | null;
  referenceMax: number | null;
  // Computed flag based on standard reference range
  flag: 'high' | 'low' | 'normal' | null;
  // Match status
  matched: boolean;
  // Validation issues (if any)
  validationIssues?: string[];
}

// Extracted data structure (matches what AI returns from PDF)
// Note: clientName/clientGender/clientBirthday are extracted but not used
// since this is a personal health tracking app
export interface ExtractedLabData {
  clientName?: string;
  clientGender?: 'male' | 'female' | 'other';
  clientBirthday?: string;
  labName?: string;
  orderingDoctor?: string;
  testDate?: string;
  biomarkers: Biomarker[];
  // Added in post-processing phase
  processedBiomarkers?: ProcessedBiomarker[];
  // Debug information for troubleshooting
  debugInfo?: ExtractionDebugInfo;
}

// Main lab upload entity
export interface LabUpload {
  id: string;
  userId: string;
  filename: string;
  storagePath: string;
  fileSize: number;
  status: LabUploadStatus;
  processingStage?: ProcessingStage;
  skipVerification: boolean;
  extractedData?: ExtractedLabData;
  extractionConfidence?: number;
  verificationPassed?: boolean;
  corrections?: string[];
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  eventId?: string;
}

// Input for creating a new upload record
export interface CreateLabUploadInput {
  filename: string;
  storagePath: string;
  fileSize: number;
  skipVerification?: boolean;
}

// Input for updating an upload record
export interface UpdateLabUploadInput {
  status?: LabUploadStatus;
  processingStage?: ProcessingStage | null;
  extractedData?: ExtractedLabData | null;
  extractionConfidence?: number | null;
  verificationPassed?: boolean | null;
  corrections?: string[] | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  eventId?: string | null;
}

// Database row shape (snake_case)
export interface LabUploadRow {
  id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  file_size: number;
  status: LabUploadStatus;
  processing_stage: ProcessingStage | null;
  skip_verification: boolean;
  extracted_data: ExtractedLabData | null;
  extraction_confidence: number | null;
  verification_passed: boolean | null;
  corrections: string[] | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  event_id: string | null;
}
