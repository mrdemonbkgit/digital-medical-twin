import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Agent } from 'undici';
import { withLogger, LoggedRequest } from '../lib/logger/withLogger.js';
import type { Logger } from '../lib/logger/Logger.js';
import { getPageCount, splitPdfIntoPages, type PageChunk } from '../lib/pdfSplitter.js';
import { mergeBiomarkers, mergeCorrections, calculateOverallVerificationStatus } from '../lib/biomarkerMerger.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientAny = SupabaseClient<any, any, any>;

// Verification status: clean = no corrections needed, corrected = corrections applied successfully, failed = couldn't verify
export type VerificationStatus = 'clean' | 'corrected' | 'failed';

// Types
interface Biomarker {
  name: string;
  value: number;
  unit: string;
  secondaryValue?: number;
  secondaryUnit?: string;
  referenceMin?: number;
  referenceMax?: number;
  flag?: 'high' | 'low' | 'normal';
}

// Processed biomarker - matched to standard with converted values
interface ProcessedBiomarker {
  originalName: string;
  originalValue: number;
  originalUnit: string;
  standardCode: string | null;
  standardName: string | null;
  standardValue: number | null;
  standardUnit: string | null;
  referenceMin: number | null;
  referenceMax: number | null;
  flag: 'high' | 'low' | 'normal' | null;
  matched: boolean;
  validationIssues?: string[];
}

// Biomarker standard from database
interface BiomarkerStandard {
  code: string;
  name: string;
  aliases: string[];
  standard_unit: string;
  unit_conversions: Record<string, number>;
  reference_ranges: {
    male: { low: number; high: number };
    female: { low: number; high: number };
  };
}

// Debug types for extraction process
interface BiomarkerMatchDetail {
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

// Per-page debug info for chunked extraction
interface PageDebugInfo {
  pageNumber: number;
  extraction: {
    startedAt: string;
    completedAt: string;
    durationMs: number;
    biomarkersExtracted: number;
    rawResponsePreview: string;
  };
  verification?: {
    startedAt: string;
    completedAt: string;
    durationMs: number;
    verificationStatus: VerificationStatus;
    correctionsCount: number;
    corrections: string[];
    rawResponsePreview?: string;
  };
}

// Merge stage info for chunked extraction
interface MergeStageInfo {
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

interface ExtractionDebugInfo {
  totalDurationMs: number;
  pdfSizeBytes: number;
  // Chunking metadata
  isChunked?: boolean;
  pageCount?: number;
  chunkThreshold?: number;
  stage1: {
    name: 'Gemini Extraction';
    startedAt: string;
    completedAt: string;
    durationMs: number;
    biomarkersExtracted: number;
    rawResponse: string;
    model: string;
    thinkingLevel: string;
    // Per-page breakdown (only for chunked)
    pagesProcessed?: number;
    avgPageDurationMs?: number;
  };
  stage2: {
    name: 'GPT Verification';
    skipped: boolean;
    startedAt?: string;
    completedAt?: string;
    durationMs?: number;
    verificationPassed?: boolean; // Backwards compatibility
    verificationStatus?: VerificationStatus;
    correctionsCount: number;
    corrections: string[];
    rawResponse?: string;
    model?: string;
    reasoningEffort?: string;
    // Per-page verification stats (only for chunked)
    pagesVerified?: number;
    pagesPassed?: number; // Backwards compatibility (pagesClean + pagesCorrected)
    pagesClean?: number;
    pagesCorrected?: number;
    pagesFailed?: number;
  };
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
  // Merge stage (only for chunked)
  mergeStage?: MergeStageInfo;
  // Per-page details (only for chunked)
  pageDetails?: PageDebugInfo[];
}

interface ExtractedLabData {
  clientName?: string;
  clientGender?: 'male' | 'female' | 'other';
  clientBirthday?: string;
  labName?: string;
  orderingDoctor?: string;
  testDate?: string;
  biomarkers: Biomarker[];
  processedBiomarkers?: ProcessedBiomarker[];
  debugInfo?: ExtractionDebugInfo;
}

interface ExtractionResult {
  success: boolean;
  extractedData?: ExtractedLabData;
  extractionConfidence: number;
  verificationStatus: VerificationStatus;
  corrections?: string[];
  error?: string;
}

type ProcessingStage = 'fetching_pdf' | 'splitting_pages' | 'extracting_gemini' | 'verifying_gpt' | 'post_processing';

// Server-side API keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

// Timeout for AI requests (20 minutes for both GPT verification and Gemini extraction)
const GPT_TIMEOUT_MS = 1200000;
const GEMINI_TIMEOUT_MS = 1200000;

// Per-page timeouts (3 minutes each for chunked extraction)
const PAGE_EXTRACTION_TIMEOUT_MS = 180000;
const PAGE_VERIFICATION_TIMEOUT_MS = 180000;

// Chunking threshold for page-by-page extraction
// - Below threshold: Single-shot extraction (faster, simpler)
// - At/above threshold: Per-page extraction with merge (handles large PDFs reliably)
// Value of 4 balances extraction quality vs API overhead based on testing
const CHUNK_PAGE_THRESHOLD = 4;

// Per-page processing result type
interface PageProcessingResult {
  pageNumber: number;
  biomarkers: Biomarker[];
  verificationStatus: VerificationStatus;
  corrections: string[];
  metadata?: Partial<ExtractedLabData>;
  // Debug timing info
  debugInfo: PageDebugInfo;
}

// Custom fetch agent with extended body timeout for long-running AI requests
const geminiAgent = new Agent({
  bodyTimeout: GEMINI_TIMEOUT_MS,
  headersTimeout: GEMINI_TIMEOUT_MS,
});

const gptAgent = new Agent({
  bodyTimeout: GPT_TIMEOUT_MS,
  headersTimeout: GPT_TIMEOUT_MS,
});

// Supabase client with service role for database updates
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getUserId(supabase: SupabaseClientAny, authHeader: string) {
  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) throw new Error('Unauthorized');
  return user.id;
}

// Get allowed origin for CORS
function getAllowedOrigin(req: VercelRequest): string {
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN || 'https://digital-medical-twin.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }
  return allowedOrigins[0];
}

// Update lab_uploads record in database
async function updateUploadStatus(
  supabase: SupabaseClientAny,
  uploadId: string,
  updates: {
    status?: 'pending' | 'processing' | 'complete' | 'partial' | 'failed';
    processing_stage?: ProcessingStage | null;
    extracted_data?: ExtractedLabData | null;
    extraction_confidence?: number | null;
    verification_passed?: boolean | null;
    corrections?: string[] | null;
    error_message?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    current_page?: number | null;
    total_pages?: number | null;
  }
) {
  const { error } = await supabase
    .from('lab_uploads')
    .update(updates)
    .eq('id', uploadId);

  if (error) {
    throw new Error(`Failed to update upload status: ${error.message}`);
  }
}

// Fetch PDF from Supabase Storage and convert to base64
async function fetchPDFAsBase64(
  supabase: SupabaseClientAny,
  storagePath: string
): Promise<string> {
  const { data, error } = await supabase.storage.from('lab-pdfs').download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download PDF: ${error?.message || 'Unknown error'}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return base64;
}

// Result type including raw response for debugging
interface GeminiExtractionResult {
  data: ExtractedLabData;
  rawResponse: string;
  model: string;
  thinkingLevel: string;
}

// Stage 1: Gemini extraction
async function extractWithGemini(pdfBase64: string): Promise<GeminiExtractionResult> {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key not configured');
  }

  const prompt = `Analyze this lab result PDF and extract all data as JSON.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "clientName": "Patient full name exactly as shown",
  "clientGender": "male" or "female" or "other",
  "clientBirthday": "YYYY-MM-DD format",
  "labName": "Lab facility name",
  "orderingDoctor": "Doctor name if shown",
  "testDate": "YYYY-MM-DD format of when tests were performed",
  "biomarkers": [
    {
      "name": "Standard English biomarker name",
      "value": 123.4,
      "unit": "primary unit as shown in PDF",
      "secondaryValue": 6.8,
      "secondaryUnit": "alternative unit if shown",
      "referenceMin": 0,
      "referenceMax": 100,
      "flag": "high" or "low" or "normal"
    }
  ]
}

Important:
- Extract ALL biomarkers/tests visible in the document
- TRANSLATE all biomarker names to standard English medical terminology
- Use standard abbreviations where appropriate (e.g., LDL, HDL, TSH, HbA1c, ALT, AST, WBC, RBC)
- Keep the ORIGINAL unit from the PDF as "unit"
- If PDF shows a secondary value with different unit, include as "secondaryValue" and "secondaryUnit"
- Parse numeric values correctly (remove commas, handle decimals)
- Determine flag based on reference range if not explicitly stated
- If a field is not found, omit it from the response
- Return ONLY the JSON object, nothing else`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        // @ts-expect-error - dispatcher is valid for undici but not in standard fetch types
        dispatcher: geminiAgent,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'application/pdf',
                    data: pdfBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 64000,
            thinkingConfig: { thinkingLevel: 'low' },
          },
        }),
      }
    );
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError' || (error as { code?: string }).code === 'UND_ERR_BODY_TIMEOUT') {
        throw new Error(`Gemini extraction timed out after ${GEMINI_TIMEOUT_MS / 60000} minutes`);
      }
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const responseText = await response.text();
  const data = JSON.parse(responseText);
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Parse JSON from response
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const extracted = JSON.parse(jsonStr);
    return {
      data: {
        clientName: extracted.clientName,
        clientGender: extracted.clientGender,
        clientBirthday: extracted.clientBirthday,
        labName: extracted.labName,
        orderingDoctor: extracted.orderingDoctor,
        testDate: extracted.testDate,
        biomarkers: extracted.biomarkers || [],
      },
      rawResponse: content.slice(0, 50000), // Truncate to 50KB
      model: 'gemini-3-pro-preview',
      thinkingLevel: 'low',
    };
  } catch {
    throw new Error('Failed to parse extraction result from Gemini');
  }
}

// Gemini streaming extraction for single page
async function extractPageWithGeminiStreaming(
  pageBase64: string,
  pageNumber: number,
  isFirstPage: boolean,
  log: Logger
): Promise<{ biomarkers: Biomarker[]; metadata?: Partial<ExtractedLabData>; parseError?: string }> {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key not configured');
  }

  const metadataFields = isFirstPage
    ? `
  "clientName": "Patient full name exactly as shown",
  "clientGender": "male" or "female" or "other",
  "clientBirthday": "YYYY-MM-DD format",
  "labName": "Lab facility name",
  "orderingDoctor": "Doctor name if shown",
  "testDate": "YYYY-MM-DD format of when tests were performed",`
    : '';

  const prompt = `Analyze this single page from a lab result PDF and extract all biomarkers as JSON.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{${metadataFields}
  "biomarkers": [
    {
      "name": "Standard English biomarker name",
      "value": 123.4,
      "unit": "primary unit as shown in PDF",
      "secondaryValue": 6.8,
      "secondaryUnit": "alternative unit if shown",
      "referenceMin": 0,
      "referenceMax": 100,
      "flag": "high" or "low" or "normal"
    }
  ]
}

Important:
- This is page ${pageNumber}${isFirstPage ? ' (first page - extract patient info if visible)' : ' (subsequent page - focus only on biomarkers)'}
- Extract ALL biomarkers/tests visible on this page
- TRANSLATE all biomarker names to standard English medical terminology
- Use standard abbreviations where appropriate (e.g., LDL, HDL, TSH, HbA1c, ALT, AST, WBC, RBC)
- Keep the ORIGINAL unit from the PDF as "unit"
- If PDF shows a secondary value with different unit, include as "secondaryValue" and "secondaryUnit"
- Parse numeric values correctly (remove commas, handle decimals)
- Determine flag based on reference range if not explicitly stated
- If a field is not found, omit it from the response
- Return ONLY the JSON object, nothing else`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PAGE_EXTRACTION_TIMEOUT_MS);

  let response: Response;
  try {
    // Use streaming API to prevent idle timeouts
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:streamGenerateContent?alt=sse&key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        // @ts-expect-error - dispatcher is valid for undici but not in standard fetch types
        dispatcher: geminiAgent,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'application/pdf',
                    data: pageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 16000, // Smaller for single page
            thinkingConfig: { thinkingLevel: 'low' }, // Faster for per-page
          },
        }),
      }
    );
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError' || (error as { code?: string }).code === 'UND_ERR_BODY_TIMEOUT') {
        throw new Error(`Page ${pageNumber} extraction timed out after ${PAGE_EXTRACTION_TIMEOUT_MS / 60000} minutes`);
      }
    }
    throw error;
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error on page ${pageNumber}: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  // Process SSE stream and accumulate text
  let accumulatedText = '';
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body from Gemini streaming API');
  }

  const decoder = new TextDecoder();
  let buffer = ''; // Buffer for incomplete SSE frames across chunks

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Append new data to buffer
      buffer += decoder.decode(value, { stream: true });

      // SSE events are delimited by double newlines (\n\n)
      // Process only complete events, keep incomplete data in buffer
      const events = buffer.split('\n\n');

      // Last element may be incomplete - keep it in buffer
      buffer = events.pop() ?? '';

      for (const event of events) {
        // Find the data: line within the event
        const lines = event.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (jsonStr.trim() === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (text) {
                accumulatedText += text;
              }
            } catch {
              // Skip unparseable data - could be empty or malformed
            }
          }
        }
      }
    }

    // Process any remaining complete event in buffer after stream ends
    if (buffer.trim()) {
      const lines = buffer.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);
          if (jsonStr.trim() === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              accumulatedText += text;
            }
          } catch {
            // Skip unparseable final data
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  log.debug(`Page ${pageNumber} streaming complete`, { textLength: accumulatedText.length });

  // Parse JSON from accumulated response
  let jsonStr = accumulatedText.trim();

  // Handle empty response - page might have no biomarkers
  if (!jsonStr) {
    log.info(`Page ${pageNumber} returned empty response - assuming no biomarkers on this page`);
    return { biomarkers: [] };
  }

  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const extracted = JSON.parse(jsonStr);
    const result: { biomarkers: Biomarker[]; metadata?: Partial<ExtractedLabData> } = {
      biomarkers: extracted.biomarkers || [],
    };

    if (isFirstPage) {
      result.metadata = {
        clientName: extracted.clientName,
        clientGender: extracted.clientGender,
        clientBirthday: extracted.clientBirthday,
        labName: extracted.labName,
        orderingDoctor: extracted.orderingDoctor,
        testDate: extracted.testDate,
      };
    }

    return result;
  } catch (parseError) {
    // Log what we received for debugging
    const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parse error';
    log.warn(`Page ${pageNumber} JSON parse failed`, {
      responsePreview: jsonStr.substring(0, 500),
      error: errorMsg
    });

    // If parsing fails, assume page has no biomarkers rather than failing the whole extraction
    // Return parseError field so caller can record this in debug info
    log.info(`Page ${pageNumber} - treating as empty page (no biomarkers)`);
    return {
      biomarkers: [],
      parseError: `PARSE_ERROR: ${errorMsg} | Response: ${jsonStr.substring(0, 200)}`
    };
  }
}

// Per-page GPT verification for single page
async function verifyPageWithGPT(
  pageBase64: string,
  extractedBiomarkers: Biomarker[],
  pageNumber: number,
  log: Logger
): Promise<{ biomarkers: Biomarker[]; status: VerificationStatus; corrections: string[] }> {
  if (!OPENAI_API_KEY) {
    log.warn(`Page ${pageNumber} verification skipped - no API key`);
    return { biomarkers: extractedBiomarkers, status: 'failed', corrections: ['OpenAI API key not configured - skipping verification'] };
  }

  const biomarkersJson = JSON.stringify(extractedBiomarkers, null, 2);

  const prompt = `You are verifying biomarker extraction from a single lab result page (page ${pageNumber}).

## Extracted Biomarkers to Verify:
\`\`\`json
${biomarkersJson}
\`\`\`

## Your Task:
Verify EACH biomarker against the attached PDF page and correct any errors.

## Verification Checklist:
For EACH biomarker:
- Name: Must be in standard English medical terminology
- Value: Must be exactly correct
- Unit: Must match the primary unit shown in PDF
- Reference range: Min and max values must match PDF
- Flag: Must be correct based on value vs reference range

## Response Format:
Return ONLY valid JSON (no markdown code blocks):
{
  "biomarkers": [...corrected biomarkers array...],
  "corrections": ["List each correction made, or empty array if none"]
}

NOTE: If corrections array is empty, the extraction was clean. If corrections were made, they have been applied successfully.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PAGE_VERIFICATION_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        // @ts-expect-error - dispatcher is valid for undici but not in standard fetch types
        dispatcher: gptAgent,
        body: JSON.stringify({
          model: 'gpt-5.1',
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_file',
                  filename: `page-${pageNumber}.pdf`,
                  file_data: `data:application/pdf;base64,${pageBase64}`,
                },
                { type: 'input_text', text: prompt },
              ],
            },
          ],
          max_output_tokens: 8000, // Smaller for single page
          reasoning: {
            effort: 'low', // Fast per-page verification
          },
        }),
      });
    } catch (fetchError) {
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError' || (fetchError as { code?: string }).code === 'UND_ERR_BODY_TIMEOUT') {
          log.warn(`Page ${pageNumber} GPT verification timed out`);
          return {
            biomarkers: extractedBiomarkers,
            status: 'failed' as VerificationStatus,
            corrections: [`Page ${pageNumber} verification timed out - using unverified extraction`],
          };
        }
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read error body');
      log.warn(`Page ${pageNumber} GPT verification HTTP error`, { status: response.status, errorBody: errorBody.substring(0, 200) });
      return {
        biomarkers: extractedBiomarkers,
        status: 'failed' as VerificationStatus,
        corrections: [`Page ${pageNumber} verification failed with HTTP ${response.status} - using unverified extraction`],
      };
    }

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      log.warn(`Page ${pageNumber} GPT response not valid JSON`, { responsePreview: responseText.substring(0, 200) });
      return {
        biomarkers: extractedBiomarkers,
        status: 'failed' as VerificationStatus,
        corrections: [`Page ${pageNumber} GPT response was not valid JSON - using unverified extraction`],
      };
    }

    // Extract content from Responses API format
    const content = data.output
      ?.filter((item: { type: string }) => item.type === 'message')
      ?.flatMap((item: { content: Array<{ type: string; text?: string }> }) => item.content)
      ?.filter((part: { type: string }) => part.type === 'output_text')
      ?.map((part: { text?: string }) => part.text)
      ?.join('') || '';

    if (!content) {
      log.warn(`Page ${pageNumber} GPT returned empty content`, { outputTypes: data.output?.map((i: { type: string }) => i.type) });
      return {
        biomarkers: extractedBiomarkers,
        status: 'failed' as VerificationStatus,
        corrections: [`Page ${pageNumber} GPT returned empty content - using unverified extraction`],
      };
    }

    // Parse JSON from response
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    let verified;
    try {
      verified = JSON.parse(jsonStr);
    } catch (parseError) {
      log.warn(`Page ${pageNumber} GPT output not valid JSON`, { contentPreview: jsonStr.substring(0, 300) });
      return {
        biomarkers: extractedBiomarkers,
        status: 'failed' as VerificationStatus,
        corrections: [`Page ${pageNumber} GPT output was not valid JSON - using unverified extraction`],
      };
    }

    // Determine verification status based on corrections
    const corrections: string[] = verified.corrections || [];
    const verificationStatus: VerificationStatus = corrections.length === 0 ? 'clean' : 'corrected';

    // Log successful verification with any corrections made
    if (corrections.length > 0) {
      log.debug(`Page ${pageNumber} GPT made corrections`, { corrections });
    }

    return {
      biomarkers: verified.biomarkers || extractedBiomarkers,
      status: verificationStatus,
      corrections,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.warn(`Page ${pageNumber} GPT verification error`, { error: errorMessage });
    return {
      biomarkers: extractedBiomarkers,
      status: 'failed' as VerificationStatus,
      corrections: [`Page ${pageNumber} verification error: ${errorMessage} - using unverified extraction`],
    };
  }
}

// Process a single page: extract with Gemini streaming, then verify with GPT
async function processPage(
  pageChunk: PageChunk,
  isFirstPage: boolean,
  skipVerification: boolean,
  uploadId: string,
  supabase: SupabaseClientAny,
  log: Logger
): Promise<PageProcessingResult> {
  // Initialize page debug info
  const pageDebug: PageDebugInfo = {
    pageNumber: pageChunk.pageNumber,
    extraction: {
      startedAt: new Date().toISOString(),
      completedAt: '',
      durationMs: 0,
      biomarkersExtracted: 0,
      rawResponsePreview: '',
    },
  };

  const extractionStart = Date.now();

  // Step 1: Extract with Gemini streaming
  const extracted = await extractPageWithGeminiStreaming(
    pageChunk.base64,
    pageChunk.pageNumber,
    isFirstPage,
    log
  );

  pageDebug.extraction.completedAt = new Date().toISOString();
  pageDebug.extraction.durationMs = Date.now() - extractionStart;
  pageDebug.extraction.biomarkersExtracted = extracted.biomarkers.length;
  // Record parse errors in rawResponsePreview if extraction had issues
  pageDebug.extraction.rawResponsePreview = extracted.parseError
    ? extracted.parseError
    : `Extracted ${extracted.biomarkers.length} biomarkers from page ${pageChunk.pageNumber}`;

  log.info(`Page ${pageChunk.pageNumber} extraction complete`, {
    biomarkerCount: extracted.biomarkers.length,
    durationMs: pageDebug.extraction.durationMs,
  });

  // Step 2: Verify with GPT (if not skipped)
  if (skipVerification) {
    return {
      pageNumber: pageChunk.pageNumber,
      biomarkers: extracted.biomarkers,
      verificationStatus: 'failed' as VerificationStatus,
      corrections: ['Verification skipped by user'],
      metadata: isFirstPage ? extracted.metadata : undefined,
      debugInfo: pageDebug,
    };
  }

  // Update status to show verification stage with current page
  await updateUploadStatus(supabase, uploadId, {
    processing_stage: 'verifying_gpt',
    current_page: pageChunk.pageNumber,
  });

  const verificationStart = Date.now();
  pageDebug.verification = {
    startedAt: new Date().toISOString(),
    completedAt: '',
    durationMs: 0,
    verificationStatus: 'failed' as VerificationStatus,
    correctionsCount: 0,
    corrections: [],
  };

  const verified = await verifyPageWithGPT(
    pageChunk.base64,
    extracted.biomarkers,
    pageChunk.pageNumber,
    log
  );

  pageDebug.verification.completedAt = new Date().toISOString();
  pageDebug.verification.durationMs = Date.now() - verificationStart;
  pageDebug.verification.verificationStatus = verified.status;
  pageDebug.verification.correctionsCount = verified.corrections.length;
  pageDebug.verification.corrections = verified.corrections;

  log.info(`Page ${pageChunk.pageNumber} verification complete`, {
    status: verified.status,
    corrections: verified.corrections.length,
    durationMs: pageDebug.verification.durationMs,
  });

  return {
    pageNumber: pageChunk.pageNumber,
    biomarkers: verified.biomarkers,
    verificationStatus: verified.status,
    corrections: verified.corrections,
    metadata: isFirstPage ? extracted.metadata : undefined,
    debugInfo: pageDebug,
  };
}

// Process all pages sequentially with progress updates
async function processAllPagesSequentially(
  chunks: PageChunk[],
  uploadId: string,
  skipVerification: boolean,
  supabase: SupabaseClientAny,
  log: Logger
): Promise<PageProcessingResult[]> {
  const results: PageProcessingResult[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isFirstPage = i === 0;

    // Update progress - set to extracting stage for this page
    await updateUploadStatus(supabase, uploadId, {
      processing_stage: 'extracting_gemini',
      current_page: chunk.pageNumber,
    });

    log.info(`Processing page ${chunk.pageNumber} of ${chunks.length}`);

    const result = await processPage(chunk, isFirstPage, skipVerification, uploadId, supabase, log);
    results.push(result);
  }

  return results;
}

// Result type for GPT verification including debug info
interface GPTVerificationResult {
  verified: ExtractedLabData;
  verificationStatus: VerificationStatus;
  corrections: string[];
  rawResponse?: string;
  model?: string;
  reasoningEffort?: string;
}

// Stage 2: GPT verification
async function verifyWithGPT(
  pdfBase64: string,
  extractedData: ExtractedLabData,
  log: Logger
): Promise<GPTVerificationResult> {
  if (!OPENAI_API_KEY) {
    return { verified: extractedData, verificationStatus: 'failed', corrections: ['OpenAI API key not configured - skipping verification'] };
  }

  const extractedJson = JSON.stringify(extractedData, null, 2);

  const prompt = `You are verifying a lab result extraction. I'm providing you with:

1. **The original lab result PDF** (attached as a file)
2. **The extracted data from another AI model** (shown below as JSON)

## Extracted Data to Verify:
\`\`\`json
${extractedJson}
\`\`\`

## Your Task:
Carefully compare the extracted JSON above against the original PDF and verify accuracy.

## Verification Checklist:
1. Patient name, gender, and birthday - must match PDF exactly
2. Lab name and ordering doctor - must match PDF
3. Test date - must be correct
4. For EACH biomarker, verify against the PDF:
   - Name: Must be in standard English medical terminology
   - Value: Must be exactly correct
   - Unit: Must match the primary unit shown in PDF
   - Secondary value/unit: If PDF shows values in multiple units
   - Reference range: Min and max values must match PDF
   - Flag: Must be correct based on value vs reference range

## Response Format:
Return ONLY valid JSON (no markdown code blocks) with the corrected/verified data:
{
  "clientName": "verified or corrected value",
  "clientGender": "male" or "female" or "other",
  "clientBirthday": "YYYY-MM-DD",
  "labName": "verified or corrected value",
  "orderingDoctor": "verified or corrected value",
  "testDate": "YYYY-MM-DD",
  "biomarkers": [...],
  "corrections": ["List each correction made, or empty array if none"]
}

NOTE: If corrections array is empty, the extraction was clean. If corrections were made, they have been applied successfully.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GPT_TIMEOUT_MS);

  log.debug('Starting GPT verification request', {
    apiKeyConfigured: !!OPENAI_API_KEY,
    apiKeyLength: OPENAI_API_KEY?.length,
  });

  try {
    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        // @ts-expect-error - dispatcher is valid for undici but not in standard fetch types
        dispatcher: gptAgent,
        body: JSON.stringify({
          model: 'gpt-5.1',
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_file',
                  filename: 'lab-result.pdf',
                  file_data: `data:application/pdf;base64,${pdfBase64}`,
                },
                { type: 'input_text', text: prompt },
              ],
            },
          ],
          max_output_tokens: 32000,
          reasoning: {
            effort: 'medium',
          },
        }),
      });
    } catch (fetchError) {
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError' || (fetchError as { code?: string }).code === 'UND_ERR_BODY_TIMEOUT') {
          return {
            verified: extractedData,
            verificationStatus: 'failed',
            corrections: [`Verification timed out after ${GPT_TIMEOUT_MS / 60000} minutes - returning unverified extraction`],
          };
        }
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read error body');
      log.error('GPT verification HTTP error', undefined, {
        status: response.status,
        errorBody: errorBody.substring(0, 500),
      });
      return {
        verified: extractedData,
        verificationStatus: 'failed',
        corrections: [`GPT verification failed with HTTP ${response.status}: ${errorBody.substring(0, 200)} - returning unverified extraction`],
      };
    }

    const responseText = await response.text();
    log.debug('GPT response received', { responseLength: responseText.length });

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return {
        verified: extractedData,
        verificationStatus: 'failed',
        corrections: ['GPT response was not valid JSON - returning unverified extraction'],
      };
    }

    // Extract content from Responses API format
    const content = data.output
      ?.filter((item: { type: string }) => item.type === 'message')
      ?.flatMap((item: { content: Array<{ type: string; text?: string }> }) => item.content)
      ?.filter((part: { type: string }) => part.type === 'output_text')
      ?.map((part: { text?: string }) => part.text)
      ?.join('') || '';

    if (!content) {
      return {
        verified: extractedData,
        verificationStatus: 'failed',
        corrections: ['GPT returned empty content - returning unverified extraction'],
      };
    }

    // Parse JSON from response
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    let verified;
    try {
      verified = JSON.parse(jsonStr);
    } catch {
      return {
        verified: extractedData,
        verificationStatus: 'failed',
        corrections: ['GPT output was not valid JSON - returning unverified extraction'],
      };
    }

    // Determine verification status based on corrections
    const corrections: string[] = verified.corrections || [];
    const verificationStatus: VerificationStatus = corrections.length === 0 ? 'clean' : 'corrected';

    return {
      verified: {
        clientName: verified.clientName,
        clientGender: verified.clientGender,
        clientBirthday: verified.clientBirthday,
        labName: verified.labName,
        orderingDoctor: verified.orderingDoctor,
        testDate: verified.testDate,
        biomarkers: verified.biomarkers || extractedData.biomarkers,
      },
      verificationStatus,
      corrections,
      rawResponse: content.slice(0, 50000), // Truncate to 50KB
      model: 'gpt-5.1',
      reasoningEffort: 'medium',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      verified: extractedData,
      verificationStatus: 'failed',
      corrections: [`GPT verification error: ${errorMessage} - returning unverified extraction`],
    };
  }
}

// Fetch all biomarker standards from database
async function fetchBiomarkerStandards(
  supabase: SupabaseClientAny
): Promise<BiomarkerStandard[]> {
  const { data, error } = await supabase
    .from('biomarker_standards')
    .select('code, name, aliases, standard_unit, unit_conversions, reference_ranges');

  if (error) {
    throw new Error(`Failed to fetch biomarker standards: ${error.message}`);
  }

  return data as BiomarkerStandard[];
}

// Result type for post-processing including debug info
interface PostProcessResult {
  processedBiomarkers: ProcessedBiomarker[];
  rawResponse: string;
  matchDetails: BiomarkerMatchDetail[];
}

// Stage 3: Post-processing with Gemini - match biomarkers to standards
async function postProcessWithGemini(
  extractedData: ExtractedLabData,
  standards: BiomarkerStandard[],
  userGender: 'male' | 'female'
): Promise<PostProcessResult> {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key not configured for post-processing');
  }

  // Create a simplified standards list for the prompt
  const standardsList = standards.map((s) => ({
    code: s.code,
    name: s.name,
    aliases: s.aliases,
    unit: s.standard_unit,
    conversions: s.unit_conversions,
  }));

  const biomarkersJson = JSON.stringify(extractedData.biomarkers, null, 2);
  const standardsJson = JSON.stringify(standardsList, null, 2);

  const prompt = `You are a biomarker matching and conversion expert. Match each extracted biomarker to its standardized equivalent and convert values.

## Extracted Biomarkers:
\`\`\`json
${biomarkersJson}
\`\`\`

## Standard Biomarkers Database:
\`\`\`json
${standardsJson}
\`\`\`

## Your Task:
For EACH extracted biomarker:
1. Match it to a standard biomarker by comparing the name with standard names and aliases
2. If matched, convert the value to the standard unit using the conversion factors
3. Flag any validation issues (e.g., value seems unreasonably high/low for that biomarker)

## Response Format:
Return ONLY valid JSON (no markdown) as an array of processed biomarkers:
[
  {
    "originalName": "The original name from extraction",
    "originalValue": 123.4,
    "originalUnit": "original unit",
    "standardCode": "matched_code or null if no match",
    "standardName": "Matched Standard Name or null",
    "standardValue": 123.4 (converted value or null),
    "standardUnit": "standard unit or null",
    "matched": true/false,
    "validationIssues": ["list of any concerns about the value"]
  }
]

Important:
- Match carefully - the extracted name may be abbreviated or in a different language
- Use the conversion factors to convert values (value_in_standard = value * factor)
- If the original unit matches the standard unit, no conversion needed
- If you can't find a matching conversion factor but the units are similar, try to match anyway
- For unmatched biomarkers, set standardCode/standardName/standardValue/standardUnit to null
- Flag validation issues like: "value appears extremely high", "negative value unexpected", etc.

## Special Rule for Vitamin D:
- Match generic "Vitamin D" (not specified as D2 or D3) to "Total Vitamin D" standard
- Common aliases: "25-Hydroxy Vitamin D", "25-OH Vitamin D", "Vitamin D, 25-Hydroxy", "Calcidiol", "25(OH)D"
- If BOTH Vitamin D2 and Vitamin D3 are present but NO Total Vitamin D is explicitly extracted:
  - Calculate Total Vitamin D = Vitamin D2 + Vitamin D3
  - Add this as an ADDITIONAL biomarker in your response with originalName: "Total Vitamin D (calculated)"
  - Mark it as matched to the "Total Vitamin D" standard`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        // @ts-expect-error - dispatcher is valid for undici but not in standard fetch types
        dispatcher: geminiAgent,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 64000,
            thinkingConfig: { thinkingLevel: 'low' },
          },
        }),
      }
    );
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError' || (error as { code?: string }).code === 'UND_ERR_BODY_TIMEOUT') {
        throw new Error(`Post-processing timed out after ${GEMINI_TIMEOUT_MS / 60000} minutes`);
      }
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini post-processing API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const responseText = await response.text();
  const data = JSON.parse(responseText);
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Parse JSON from response
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  let processedBiomarkers: ProcessedBiomarker[];
  try {
    processedBiomarkers = JSON.parse(jsonStr);
  } catch {
    throw new Error('Failed to parse post-processing result from Gemini');
  }

  // Add reference ranges and flags from standards
  for (const processed of processedBiomarkers) {
    if (processed.matched && processed.standardCode) {
      const standard = standards.find((s) => s.code === processed.standardCode);
      if (standard) {
        const range = standard.reference_ranges[userGender];
        processed.referenceMin = range.low;
        processed.referenceMax = range.high;

        // Calculate flag based on standard range
        if (processed.standardValue !== null) {
          if (processed.standardValue < range.low) {
            processed.flag = 'low';
          } else if (processed.standardValue > range.high) {
            processed.flag = 'high';
          } else {
            processed.flag = 'normal';
          }
        }
      }
    }
  }

  // Build match details for debugging
  const matchDetails: BiomarkerMatchDetail[] = processedBiomarkers.map((b) => ({
    originalName: b.originalName,
    matchedCode: b.standardCode,
    matchedName: b.standardName,
    conversionApplied:
      b.standardValue !== null && b.standardValue !== b.originalValue
        ? {
            fromValue: b.originalValue,
            fromUnit: b.originalUnit,
            toValue: b.standardValue,
            toUnit: b.standardUnit!,
            factor: b.originalValue !== 0 ? b.standardValue / b.originalValue : 0,
          }
        : undefined,
    validationIssues: b.validationIssues || [],
  }));

  return {
    processedBiomarkers,
    rawResponse: content.slice(0, 50000), // Truncate to 50KB
    matchDetails,
  };
}

async function handler(req: LoggedRequest, res: VercelResponse) {
  const log = req.log.child('ProcessLabUpload');
  log.info('Request received', { method: req.method });

  // CORS headers
  const allowedOrigin = getAllowedOrigin(req);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const { uploadId } = req.body;
  if (!uploadId) {
    return res.status(400).json({ error: 'uploadId is required' });
  }

  const supabase = createSupabaseClient();
  const startTime = Date.now();

  try {
    // Verify user owns this upload
    const userId = await getUserId(supabase, authHeader);

    // Get upload record
    const { data: upload, error: fetchError } = await supabase
      .from('lab_uploads')
      .select('*')
      .eq('id', uploadId)
      .single();

    if (fetchError || !upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    if (upload.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to upload' });
    }

    if (upload.status === 'processing') {
      return res.status(409).json({ error: 'Upload is already being processed' });
    }

    // Allow re-processing of completed uploads (for retry functionality)
    // Note: Previously completed uploads can be re-processed if status was reset to pending

    // Mark as processing
    await updateUploadStatus(supabase, uploadId, {
      status: 'processing',
      processing_stage: 'fetching_pdf',
      started_at: new Date().toISOString(),
      error_message: null,
    });

    log.info('Starting extraction', { uploadId, filename: upload.filename });

    // Initialize debug info
    const pdfSizeBytes = upload.file_size || 0;
    const debugInfo: ExtractionDebugInfo = {
      totalDurationMs: 0,
      pdfSizeBytes,
      stage1: {
        name: 'Gemini Extraction',
        startedAt: '',
        completedAt: '',
        durationMs: 0,
        biomarkersExtracted: 0,
        rawResponse: '',
        model: 'gemini-3-pro-preview',
        thinkingLevel: 'high',
      },
      stage2: {
        name: 'GPT Verification',
        skipped: upload.skip_verification,
        correctionsCount: 0,
        corrections: [],
      },
      stage3: {
        name: 'Biomarker Matching',
        startedAt: '',
        completedAt: '',
        durationMs: 0,
        standardsCount: 0,
        matchedCount: 0,
        unmatchedCount: 0,
        userGender: 'male',
        rawResponse: '',
        matchDetails: [],
      },
    };

    // Stage 0: Fetch PDF
    log.info('Fetching PDF from storage');
    const pdfBase64 = await fetchPDFAsBase64(supabase, upload.storage_path);
    const pdfSizeKB = (pdfBase64.length * 0.75 / 1024).toFixed(1);
    log.debug('PDF fetched', { pdfSizeKB });

    // Check page count to decide between single-shot and chunked extraction
    const pageCount = await getPageCount(pdfBase64);
    log.info('PDF page count', { pageCount, chunkedThreshold: CHUNK_PAGE_THRESHOLD });

    let finalData: ExtractedLabData;
    let verificationStatus: VerificationStatus = 'failed';
    let corrections: string[] = [];
    let extractionConfidence = 0.8;

    if (pageCount >= CHUNK_PAGE_THRESHOLD) {
      // CHUNKED PATH: Page-by-page extraction for large PDFs
      log.info('Using CHUNKED extraction for large PDF');

      // Split PDF into pages
      await updateUploadStatus(supabase, uploadId, { processing_stage: 'splitting_pages' });
      const chunks = await splitPdfIntoPages(pdfBase64);
      log.info('PDF split into pages', { pageCount: chunks.length });

      // Set up page progress tracking
      await updateUploadStatus(supabase, uploadId, {
        processing_stage: 'extracting_gemini',
        total_pages: chunks.length,
        current_page: 1,
      });

      const stage1Start = Date.now();
      debugInfo.stage1.startedAt = new Date().toISOString();

      // Process all pages sequentially with per-page extraction and verification
      const pageResults = await processAllPagesSequentially(
        chunks,
        uploadId,
        upload.skip_verification,
        supabase,
        log
      );

      // Merge results from all pages
      const mergeResult = mergeBiomarkers(pageResults);
      const allCorrections = mergeCorrections(pageResults);
      verificationStatus = calculateOverallVerificationStatus(pageResults);

      // Calculate per-page stats
      const totalBiomarkersBeforeMerge = pageResults.reduce(
        (sum, pr) => sum + pr.biomarkers.length,
        0
      );
      const extractionDurations = pageResults.map(pr => pr.debugInfo.extraction.durationMs);
      const avgExtractionDuration = extractionDurations.length > 0
        ? Math.round(extractionDurations.reduce((a, b) => a + b, 0) / extractionDurations.length)
        : 0;
      const pagesVerified = pageResults.filter(pr => pr.debugInfo.verification).length;
      const pagesClean = pageResults.filter(pr => pr.debugInfo.verification?.verificationStatus === 'clean').length;
      const pagesCorrected = pageResults.filter(pr => pr.debugInfo.verification?.verificationStatus === 'corrected').length;
      const pagesFailed = pageResults.filter(pr => pr.debugInfo.verification?.verificationStatus === 'failed').length;

      // Calculate total verification duration
      const totalVerificationDuration = pageResults.reduce(
        (sum, pr) => sum + (pr.debugInfo.verification?.durationMs || 0),
        0
      );

      debugInfo.stage1.completedAt = new Date().toISOString();
      debugInfo.stage1.durationMs = Date.now() - stage1Start - totalVerificationDuration; // Extraction time only
      debugInfo.stage1.biomarkersExtracted = mergeResult.biomarkers.length;
      debugInfo.stage1.rawResponse = `Chunked extraction: ${pageCount} pages processed`;
      debugInfo.stage1.model = 'gemini-3-pro-preview (streaming)';
      debugInfo.stage1.thinkingLevel = 'low';
      debugInfo.stage1.pagesProcessed = pageCount;
      debugInfo.stage1.avgPageDurationMs = avgExtractionDuration;

      // Add chunking metadata
      debugInfo.isChunked = true;
      debugInfo.pageCount = pageCount;
      debugInfo.chunkThreshold = CHUNK_PAGE_THRESHOLD;

      // Get metadata from first page
      const firstPageMetadata = pageResults[0]?.metadata || {};

      finalData = {
        clientName: firstPageMetadata.clientName,
        clientGender: firstPageMetadata.clientGender,
        clientBirthday: firstPageMetadata.clientBirthday,
        labName: firstPageMetadata.labName,
        orderingDoctor: firstPageMetadata.orderingDoctor,
        testDate: firstPageMetadata.testDate,
        biomarkers: mergeResult.biomarkers,
      };

      corrections = allCorrections;
      if (mergeResult.duplicatesRemoved > 0) {
        corrections.push(`${mergeResult.duplicatesRemoved} duplicate biomarker(s) removed during merge`);
      }
      if (mergeResult.warnings.length > 0) {
        corrections.push(...mergeResult.warnings);
      }

      extractionConfidence = verificationStatus !== 'failed' ? 0.95 : 0.7;

      // Mark stage 2 info for chunked path
      debugInfo.stage2.skipped = upload.skip_verification;
      debugInfo.stage2.durationMs = totalVerificationDuration;
      debugInfo.stage2.verificationPassed = verificationStatus !== 'failed'; // Backwards compatibility
      debugInfo.stage2.verificationStatus = verificationStatus;
      debugInfo.stage2.correctionsCount = allCorrections.length;
      debugInfo.stage2.corrections = allCorrections;
      debugInfo.stage2.model = 'gpt-5.1 (per-page)';
      debugInfo.stage2.reasoningEffort = 'low';
      debugInfo.stage2.pagesVerified = pagesVerified;
      debugInfo.stage2.pagesPassed = pagesClean + pagesCorrected; // Backwards compatibility
      debugInfo.stage2.pagesClean = pagesClean;
      debugInfo.stage2.pagesCorrected = pagesCorrected;
      debugInfo.stage2.pagesFailed = pagesFailed;

      // Add merge stage info
      debugInfo.mergeStage = {
        name: 'Biomarker Merge',
        totalBiomarkersBeforeMerge,
        totalBiomarkersAfterMerge: mergeResult.biomarkers.length,
        duplicatesRemoved: mergeResult.duplicatesRemoved,
        conflictsResolved: 0, // No conflict resolution currently tracked
      };

      // Add per-page details
      debugInfo.pageDetails = pageResults.map(pr => pr.debugInfo);

      // Clear page progress
      await updateUploadStatus(supabase, uploadId, {
        current_page: null,
        total_pages: null,
      });

      log.info('Chunked extraction complete', {
        totalBiomarkers: mergeResult.biomarkers.length,
        duplicatesRemoved: mergeResult.duplicatesRemoved,
        verificationStatus,
        correctionsCount: corrections.length,
      });

    } else {
      // SINGLE-SHOT PATH: Original extraction for small PDFs (1-3 pages)
      log.info('Using SINGLE-SHOT extraction for small PDF');

      // Stage 1: Extract with Gemini
      await updateUploadStatus(supabase, uploadId, { processing_stage: 'extracting_gemini' });
      log.info('Stage 1: Extracting with Gemini');

      const stage1Start = Date.now();
      debugInfo.stage1.startedAt = new Date().toISOString();

      const geminiResult = await extractWithGemini(pdfBase64);
      const extractedData = geminiResult.data;

      debugInfo.stage1.completedAt = new Date().toISOString();
      debugInfo.stage1.durationMs = Date.now() - stage1Start;
      debugInfo.stage1.biomarkersExtracted = extractedData.biomarkers.length;
      debugInfo.stage1.rawResponse = geminiResult.rawResponse;
      debugInfo.stage1.model = geminiResult.model;
      debugInfo.stage1.thinkingLevel = geminiResult.thinkingLevel;

      // Mark as single-shot (not chunked)
      debugInfo.isChunked = false;
      debugInfo.pageCount = pageCount;
      debugInfo.chunkThreshold = CHUNK_PAGE_THRESHOLD;

      log.info('Stage 1 complete', { biomarkerCount: extractedData.biomarkers.length });

      // Stage 2: Verify with GPT (optional)
      finalData = extractedData;

      if (!upload.skip_verification) {
        await updateUploadStatus(supabase, uploadId, { processing_stage: 'verifying_gpt' });
        log.info('Stage 2: Verifying with GPT');

        const stage2Start = Date.now();
        debugInfo.stage2.startedAt = new Date().toISOString();

        const verificationResult = await verifyWithGPT(pdfBase64, extractedData, log);
        finalData = verificationResult.verified;
        verificationStatus = verificationResult.verificationStatus;
        corrections = verificationResult.corrections;
        extractionConfidence = verificationStatus !== 'failed' ? 0.95 : 0.7;

        debugInfo.stage2.completedAt = new Date().toISOString();
        debugInfo.stage2.durationMs = Date.now() - stage2Start;
        debugInfo.stage2.verificationPassed = verificationStatus !== 'failed'; // Backwards compatibility
        debugInfo.stage2.verificationStatus = verificationStatus;
        debugInfo.stage2.correctionsCount = corrections.length;
        debugInfo.stage2.corrections = corrections;
        debugInfo.stage2.rawResponse = verificationResult.rawResponse;
        debugInfo.stage2.model = verificationResult.model;
        debugInfo.stage2.reasoningEffort = verificationResult.reasoningEffort;

        log.info('Stage 2 complete', { verificationStatus, correctionsCount: corrections.length });
      } else {
        log.info('Skipping verification (user preference)');
        corrections = ['Verification skipped by user'];
        debugInfo.stage2.corrections = corrections;
        debugInfo.stage2.correctionsCount = 1;
      }
    }

    // Stage 3: Post-processing - match to standards and convert units
    await updateUploadStatus(supabase, uploadId, { processing_stage: 'post_processing' });
    log.info('Stage 3: Post-processing with Gemini');

    const stage3Start = Date.now();
    debugInfo.stage3.startedAt = new Date().toISOString();

    try {
      // Get user profile for gender-specific reference ranges
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('gender')
        .eq('user_id', userId)
        .single();

      // Default to using extracted gender or 'male' as fallback
      const userGender: 'male' | 'female' =
        userProfile?.gender === 'female'
          ? 'female'
          : finalData.clientGender === 'female'
            ? 'female'
            : 'male';

      debugInfo.stage3.userGender = userGender;

      // Fetch biomarker standards
      const standards = await fetchBiomarkerStandards(supabase);
      debugInfo.stage3.standardsCount = standards.length;
      log.info('Fetched biomarker standards', { count: standards.length });

      // Run post-processing
      const postProcessResult = await postProcessWithGemini(finalData, standards, userGender);

      // Count matched vs unmatched
      const matchedCount = postProcessResult.processedBiomarkers.filter((b) => b.matched).length;
      const unmatchedCount = postProcessResult.processedBiomarkers.filter((b) => !b.matched).length;

      debugInfo.stage3.completedAt = new Date().toISOString();
      debugInfo.stage3.durationMs = Date.now() - stage3Start;
      debugInfo.stage3.matchedCount = matchedCount;
      debugInfo.stage3.unmatchedCount = unmatchedCount;
      debugInfo.stage3.rawResponse = postProcessResult.rawResponse;
      debugInfo.stage3.matchDetails = postProcessResult.matchDetails;

      log.info('Stage 3 complete', {
        totalBiomarkers: postProcessResult.processedBiomarkers.length,
        matched: matchedCount,
        unmatched: unmatchedCount,
      });

      // Add processed biomarkers to final data
      finalData.processedBiomarkers = postProcessResult.processedBiomarkers;

      // Add post-processing info to corrections
      if (unmatchedCount > 0) {
        corrections.push(`${unmatchedCount} biomarker(s) could not be matched to standards - review required`);
      }
    } catch (postProcessError) {
      const errorMessage = postProcessError instanceof Error ? postProcessError.message : 'Unknown error';
      log.error('Stage 3 failed (continuing without processed biomarkers)', postProcessError);
      corrections.push(`Post-processing failed: ${errorMessage} - biomarkers not standardized`);
      debugInfo.stage3.completedAt = new Date().toISOString();
      debugInfo.stage3.durationMs = Date.now() - stage3Start;
    }

    // Calculate total duration and add debug info to final data
    debugInfo.totalDurationMs = Date.now() - startTime;
    finalData.debugInfo = debugInfo;

    // Determine final status: 'partial' if post-processing failed (no processedBiomarkers)
    const postProcessingFailed = !finalData.processedBiomarkers || finalData.processedBiomarkers.length === 0;
    const finalStatus = postProcessingFailed ? 'partial' : 'complete';

    // Update with final results
    // Note: Database column is `verification_passed` (boolean), so we convert status to boolean
    // 'clean' or 'corrected' = true (verification succeeded), 'failed' = false
    await updateUploadStatus(supabase, uploadId, {
      status: finalStatus,
      processing_stage: null,
      extracted_data: finalData,
      extraction_confidence: extractionConfidence,
      verification_passed: verificationStatus !== 'failed',
      corrections: corrections.length > 0 ? corrections : null,
      completed_at: new Date().toISOString(),
    });

    const totalTime = Date.now() - startTime;
    const matchedCount = finalData.processedBiomarkers?.filter((b) => b.matched).length || 0;
    const unmatchedCount = finalData.processedBiomarkers?.filter((b) => !b.matched).length || 0;

    log.info('Extraction COMPLETE', {
      totalTimeMs: totalTime,
      biomarkerCount: finalData.biomarkers.length,
      matchedBiomarkers: matchedCount,
      unmatchedBiomarkers: unmatchedCount,
      verificationStatus,
    });

    return res.status(200).json({
      success: true,
      extractedData: finalData,
      extractionConfidence,
      verificationPassed: verificationStatus !== 'failed', // Backwards compatibility for frontend
      verificationStatus, // New field with more detail: 'clean' | 'corrected' | 'failed'
      corrections,
      matchedBiomarkers: matchedCount,
      unmatchedBiomarkers: unmatchedCount,
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Extraction failed';
    log.error('Extraction FAILED', error, { totalTimeMs: totalTime });

    // Update status to failed
    try {
      await updateUploadStatus(supabase, uploadId, {
        status: 'failed',
        processing_stage: null,
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      });
    } catch (updateError) {
      log.error('Failed to update status to failed', updateError);
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

export default withLogger(handler);
