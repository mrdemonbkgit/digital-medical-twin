import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Agent } from 'undici';
import { withLogger, LoggedRequest } from '../lib/logger/withLogger.js';
import type { Logger } from '../lib/logger/Logger.js';

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

interface ExtractedLabData {
  clientName?: string;
  clientGender?: 'male' | 'female' | 'other';
  clientBirthday?: string;
  labName?: string;
  orderingDoctor?: string;
  testDate?: string;
  biomarkers: Biomarker[];
  processedBiomarkers?: ProcessedBiomarker[];
}

interface ExtractionResult {
  success: boolean;
  extractedData?: ExtractedLabData;
  extractionConfidence: number;
  verificationPassed: boolean;
  corrections?: string[];
  error?: string;
}

type ProcessingStage = 'fetching_pdf' | 'extracting_gemini' | 'verifying_gpt' | 'post_processing';

// Server-side API keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

// Timeout for AI requests (10 minutes for both GPT verification and Gemini extraction)
const GPT_TIMEOUT_MS = 600000;
const GEMINI_TIMEOUT_MS = 600000;

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

async function getUserId(supabase: ReturnType<typeof createClient>, authHeader: string) {
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
  supabase: ReturnType<typeof createClient>,
  uploadId: string,
  updates: {
    status?: 'pending' | 'processing' | 'complete' | 'failed';
    processing_stage?: ProcessingStage | null;
    extracted_data?: ExtractedLabData | null;
    extraction_confidence?: number | null;
    verification_passed?: boolean | null;
    corrections?: string[] | null;
    error_message?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
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
  supabase: ReturnType<typeof createClient>,
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

// Stage 1: Gemini extraction
async function extractWithGemini(pdfBase64: string): Promise<ExtractedLabData> {
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
            thinkingConfig: { thinkingLevel: 'high' },
          },
        }),
      }
    );
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError' || (error as { code?: string }).code === 'UND_ERR_BODY_TIMEOUT') {
        throw new Error('Gemini extraction timed out after 10 minutes');
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

  const data = await response.json();
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
      clientName: extracted.clientName,
      clientGender: extracted.clientGender,
      clientBirthday: extracted.clientBirthday,
      labName: extracted.labName,
      orderingDoctor: extracted.orderingDoctor,
      testDate: extracted.testDate,
      biomarkers: extracted.biomarkers || [],
    };
  } catch {
    throw new Error('Failed to parse extraction result from Gemini');
  }
}

// Stage 2: GPT verification
async function verifyWithGPT(
  pdfBase64: string,
  extractedData: ExtractedLabData,
  log: Logger
): Promise<{ verified: ExtractedLabData; verificationPassed: boolean; corrections: string[] }> {
  if (!OPENAI_API_KEY) {
    return { verified: extractedData, verificationPassed: false, corrections: ['OpenAI API key not configured - skipping verification'] };
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
  "corrections": ["List each correction made"],
  "verificationPassed": true
}`;

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
            verificationPassed: false,
            corrections: ['Verification timed out after 10 minutes - returning unverified extraction'],
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
        verificationPassed: false,
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
        verificationPassed: false,
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
        verificationPassed: false,
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
        verificationPassed: false,
        corrections: ['GPT output was not valid JSON - returning unverified extraction'],
      };
    }

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
      verificationPassed: verified.verificationPassed ?? true,
      corrections: verified.corrections || [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      verified: extractedData,
      verificationPassed: false,
      corrections: [`GPT verification error: ${errorMessage} - returning unverified extraction`],
    };
  }
}

// Fetch all biomarker standards from database
async function fetchBiomarkerStandards(
  supabase: ReturnType<typeof createClient>
): Promise<BiomarkerStandard[]> {
  const { data, error } = await supabase
    .from('biomarker_standards')
    .select('code, name, aliases, standard_unit, unit_conversions, reference_ranges');

  if (error) {
    throw new Error(`Failed to fetch biomarker standards: ${error.message}`);
  }

  return data as BiomarkerStandard[];
}

// Stage 3: Post-processing with Gemini - match biomarkers to standards
async function postProcessWithGemini(
  extractedData: ExtractedLabData,
  standards: BiomarkerStandard[],
  userGender: 'male' | 'female'
): Promise<ProcessedBiomarker[]> {
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
- Flag validation issues like: "value appears extremely high", "negative value unexpected", etc.`;

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
            thinkingConfig: { thinkingLevel: 'high' },
          },
        }),
      }
    );
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError' || (error as { code?: string }).code === 'UND_ERR_BODY_TIMEOUT') {
        throw new Error('Post-processing timed out after 10 minutes');
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

  const data = await response.json();
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

  return processedBiomarkers;
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

    // Stage 0: Fetch PDF
    log.info('Fetching PDF from storage');
    const pdfBase64 = await fetchPDFAsBase64(supabase, upload.storage_path);
    const pdfSizeKB = (pdfBase64.length * 0.75 / 1024).toFixed(1);
    log.debug('PDF fetched', { pdfSizeKB });

    // Stage 1: Extract with Gemini
    await updateUploadStatus(supabase, uploadId, { processing_stage: 'extracting_gemini' });
    log.info('Stage 1: Extracting with Gemini');

    const extractedData = await extractWithGemini(pdfBase64);
    log.info('Stage 1 complete', { biomarkerCount: extractedData.biomarkers.length });

    // Stage 2: Verify with GPT (optional)
    let finalData = extractedData;
    let verificationPassed = false;
    let corrections: string[] = [];
    let extractionConfidence = 0.8;

    if (!upload.skip_verification) {
      await updateUploadStatus(supabase, uploadId, { processing_stage: 'verifying_gpt' });
      log.info('Stage 2: Verifying with GPT');

      const verificationResult = await verifyWithGPT(pdfBase64, extractedData, log);
      finalData = verificationResult.verified;
      verificationPassed = verificationResult.verificationPassed;
      corrections = verificationResult.corrections;
      extractionConfidence = verificationPassed ? 0.95 : 0.7;

      log.info('Stage 2 complete', { verificationPassed, correctionsCount: corrections.length });
    } else {
      log.info('Skipping verification (user preference)');
      corrections = ['Verification skipped by user'];
    }

    // Stage 3: Post-processing - match to standards and convert units
    await updateUploadStatus(supabase, uploadId, { processing_stage: 'post_processing' });
    log.info('Stage 3: Post-processing with Gemini');

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

      // Fetch biomarker standards
      const standards = await fetchBiomarkerStandards(supabase);
      log.info('Fetched biomarker standards', { count: standards.length });

      // Run post-processing
      const processedBiomarkers = await postProcessWithGemini(finalData, standards, userGender);

      // Count matched vs unmatched
      const matchedCount = processedBiomarkers.filter((b) => b.matched).length;
      const unmatchedCount = processedBiomarkers.filter((b) => !b.matched).length;

      log.info('Stage 3 complete', {
        totalBiomarkers: processedBiomarkers.length,
        matched: matchedCount,
        unmatched: unmatchedCount,
      });

      // Add processed biomarkers to final data
      finalData.processedBiomarkers = processedBiomarkers;

      // Add post-processing info to corrections
      if (unmatchedCount > 0) {
        corrections.push(`${unmatchedCount} biomarker(s) could not be matched to standards - review required`);
      }
    } catch (postProcessError) {
      const errorMessage = postProcessError instanceof Error ? postProcessError.message : 'Unknown error';
      log.error('Stage 3 failed (continuing without processed biomarkers)', postProcessError);
      corrections.push(`Post-processing failed: ${errorMessage} - biomarkers not standardized`);
    }

    // Update with final results
    await updateUploadStatus(supabase, uploadId, {
      status: 'complete',
      processing_stage: null,
      extracted_data: finalData,
      extraction_confidence: extractionConfidence,
      verification_passed: verificationPassed,
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
      verificationPassed,
    });

    return res.status(200).json({
      success: true,
      extractedData: finalData,
      extractionConfidence,
      verificationPassed,
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
