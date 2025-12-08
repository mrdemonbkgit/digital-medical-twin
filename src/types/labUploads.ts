import type { Biomarker } from './events';

// Upload status lifecycle
// 'partial' = extraction succeeded but post-processing failed (biomarkers not standardized)
export type LabUploadStatus = 'pending' | 'processing' | 'complete' | 'partial' | 'failed';

// Processing stages for progress tracking
export type ProcessingStage =
  | 'fetching_pdf'
  | 'splitting_pages'
  | 'extracting_gemini'
  | 'verifying_gpt'
  | 'post_processing';

// Per-page debug info for chunked extraction
export interface PageDebugInfo {
  pageNumber: number;

  // Gemini extraction for this page
  extraction: {
    startedAt: string;
    completedAt: string;
    durationMs: number;
    biomarkersExtracted: number;
    rawResponsePreview: string; // First 500 chars
  };

  // GPT verification for this page (optional if skipped)
  verification?: {
    startedAt: string;
    completedAt: string;
    durationMs: number;
    verificationPassed: boolean;
    correctionsCount: number;
    corrections: string[];
    rawResponsePreview?: string;
  };
}

// Merge stage info for chunked extraction
export interface MergeStageInfo {
  name: 'Biomarker Merge';
  totalBiomarkersBeforeMerge: number;
  totalBiomarkersAfterMerge: number;
  duplicatesRemoved: number;
  conflictsResolved: number;
  conflicts?: Array<{
    biomarkerName: string;
    sourcePages: number[];
    values: number[];
    resolvedValue: number;
  }>;
}

// Debug information for extraction process
export interface ExtractionDebugInfo {
  // Overall metrics
  totalDurationMs: number;
  pdfSizeBytes: number;

  // Chunking metadata (for multi-page extraction)
  isChunked?: boolean;
  pageCount?: number;
  chunkThreshold?: number; // e.g., 4

  // Stage 1: Gemini Extraction
  stage1: {
    name: 'Gemini Extraction';
    startedAt: string;
    completedAt: string;
    durationMs: number;
    biomarkersExtracted: number;
    rawResponse: string; // Truncated if too large, or "See per-page details" for chunked
    model: string;
    thinkingLevel: string;
    // Per-page breakdown (only for chunked)
    pagesProcessed?: number;
    avgPageDurationMs?: number;
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
    // Per-page verification stats (only for chunked)
    pagesVerified?: number;
    pagesPassed?: number;
    pagesFailed?: number;
  };

  // Stage 3: Post-Processing (matching + deterministic conversion)
  stage3: {
    name: 'Biomarker Matching & Conversion';
    startedAt: string;
    completedAt: string;
    durationMs: number;
    standardsCount: number;
    matchedCount: number;
    unmatchedCount: number;
    userGender: 'male' | 'female';
    rawResponse: string;
    matchDetails: BiomarkerMatchDetail[];
    // Conversion statistics (deterministic unit conversion)
    conversionMethod: 'deterministic';
    conversionsApplied: number; // How many biomarkers had unit conversion applied
    conversionsMissing: number; // How many couldn't find a conversion factor
  };

  // Merge stage (only for chunked extraction)
  mergeStage?: MergeStageInfo;

  // Per-page details (only for chunked extraction)
  pageDetails?: PageDebugInfo[];
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
  // Track when conversion was needed but no factor was found
  conversionMissing?: {
    fromUnit: string;
    toUnit: string;
  };
  validationIssues: string[];
}

// Processed biomarker - matched to standard with converted values
export interface ProcessedBiomarker {
  // Original extracted data
  originalName: string;
  originalValue: number | string; // Numeric for quantitative, string for qualitative
  originalUnit: string;
  // Matched standard (null if unmatched)
  standardCode: string | null;
  standardName: string | null;
  // Converted value in standard unit (null for qualitative)
  standardValue: number | string | null;
  standardUnit: string | null;
  // Reference range (gender-specific from standards, null for qualitative)
  referenceMin: number | null;
  referenceMax: number | null;
  // Computed flag based on standard reference range (null for qualitative)
  flag: 'high' | 'low' | 'normal' | null;
  // Match status
  matched: boolean;
  // Is this a qualitative result (e.g., "Negative", "Positive")?
  isQualitative?: boolean;
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
  // Page progress tracking for chunked extraction
  currentPage?: number;
  totalPages?: number;
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
  // Page progress tracking for chunked extraction
  currentPage?: number | null;
  totalPages?: number | null;
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
  // Page progress tracking for chunked extraction
  current_page: number | null;
  total_pages: number | null;
}
