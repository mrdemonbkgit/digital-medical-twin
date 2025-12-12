import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Agent } from 'undici';
import { withLogger, LoggedRequest } from '../lib/logger/withLogger.js';
import {
  createSupabaseClient,
  getUserId,
  SupabaseClientAny,
} from '../lib/supabase.js';

// Verification status: clean = no corrections needed, corrected = corrections applied successfully, failed = couldn't verify
type VerificationStatus = 'clean' | 'corrected' | 'failed';

// Types
interface Biomarker {
  name: string;
  value: number | string; // Numeric for quantitative, string for qualitative (e.g., "Negative")
  unit: string;
  secondaryValue?: number;
  secondaryUnit?: string;
  referenceMin?: number;
  referenceMax?: number;
  flag?: 'high' | 'low' | 'normal';
  isQualitative?: boolean; // True for qualitative results like "Negative", "Positive", "Trace"
}

interface ExtractionResult {
  success: boolean;
  clientName?: string;
  clientGender?: 'male' | 'female' | 'other';
  clientBirthday?: string;
  labName?: string;
  orderingDoctor?: string;
  testDate?: string;
  biomarkers: Biomarker[];
  extractionConfidence: number;
  verificationPassed?: boolean; // Backwards compatibility
  verificationStatus: VerificationStatus;
  corrections?: string[];
  error?: string;
}

// Server-side API keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

// Timeout for AI requests (10 minutes)
const AI_REQUEST_TIMEOUT_MS = 600000;

// Custom fetch agent with extended body timeout for long-running AI requests
const longTimeoutAgent = new Agent({
  bodyTimeout: AI_REQUEST_TIMEOUT_MS,
  headersTimeout: AI_REQUEST_TIMEOUT_MS,
});

// Get allowed origin for CORS
function getAllowedOrigin(req: VercelRequest): string {
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN || 'https://digital-medical-twin.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }
  return allowedOrigins[0];
}

// Stage 1: Gemini 3 Pro extraction (thinking: high)
async function extractWithGemini(pdfBase64: string): Promise<ExtractionResult> {
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
      "value": 123.4 or "Negative",
      "unit": "primary unit as shown in PDF",
      "secondaryValue": 6.8,
      "secondaryUnit": "alternative unit if shown",
      "referenceMin": 0,
      "referenceMax": 100,
      "flag": "high" or "low" or "normal",
      "isQualitative": false or true
    }
  ]
}

Important:
- Extract ALL biomarkers/tests visible in the document
- TRANSLATE all biomarker names to standard English medical terminology (e.g., "Cholesterol toàn phần" → "Total Cholesterol", "Đường huyết" → "Glucose", "Hồng cầu" → "RBC")
- Use standard abbreviations where appropriate (e.g., LDL, HDL, TSH, HbA1c, ALT, AST, WBC, RBC)
- Keep the ORIGINAL unit from the PDF as "unit"
- If PDF shows a secondary value with different unit (e.g., both mg/dL and mmol/L), include as "secondaryValue" and "secondaryUnit"
- Parse numeric values correctly (remove commas, handle decimals)
- Determine flag based on reference range if not explicitly stated
- If a field is not found, omit it from the response
- Return ONLY the JSON object, nothing else

## URINALYSIS HANDLING (CRITICAL):
Urinalysis results come from TWO different methods - identify and extract correctly:

1. **Dipstick/Chemical Analysis** (qualitative results):
   - Section headers: "Dipstick", "Chemical", "Tổng Phân Tích Nước Tiểu"
   - These tests have TEXT values, NOT numeric values - extract the text!
   - IMPORTANT: Text like "Âm Tính" IS the value - do NOT set value to null!
   - Extract and translate these text values:
     * "Âm Tính" or "Âm tính" → set value to "Negative"
     * "Dương Tính" or "Dương tính" or "Có phát hiện" → set value to "Positive"
     * "Bình thường" → set value to "Normal"
     * "Vết" → set value to "Trace"
     * "+", "++", "+++" → keep as-is
   - TRANSLATE Vietnamese test names to English:
     * Máu → "Blood (Urine)"
     * Bạch Cầu → "Leukocytes (Urine)"
     * Đường → "Glucose (Urine)"
     * Đạm → "Protein (Urine)"
   - Set "isQualitative": true for these
   - Set "unit": "qualitative"
   - DO NOT include referenceMin/referenceMax for qualitative results
   - Example: {"name": "Blood (Urine)", "value": "Negative", "unit": "qualitative", "isQualitative": true}
   - Common tests: Blood, Protein, Glucose, Ketones, Bilirubin, Nitrite, Leukocytes, Urobilinogen

2. **Microscopy/Sediment Analysis** (quantitative results):
   - Section headers: "Microscopy", "Sediment", "Tế bào cặn", "Vi thể"
   - Results are NUMERIC values with units like /μL or cells/HPF
   - Set "isQualitative": false (or omit)
   - Include proper numeric value and unit
   - Vietnamese terms: Hồng Cầu = RBC, Bạch Cầu = WBC, Trụ = Casts, Tinh Thể = Crystals
   - Examples: RBC (Microscopy), WBC (Microscopy), Epithelial Cells, Casts, Crystals

For biomarkers that appear in BOTH sections (like RBC/WBC), extract BOTH:
- "Urine Blood" (dipstick, qualitative) AND "Urine RBC (Microscopy)" (numeric /μL)
- "Urine WBC" (dipstick, qualitative) AND "Urine WBC (Microscopy)" (numeric /μL)`;

  // Set up timeout with AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        // @ts-expect-error - dispatcher is valid for undici but not in standard fetch types
        dispatcher: longTimeoutAgent,
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
      // Handle AbortError (manual timeout) or BodyTimeoutError (undici body timeout)
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
    // Error will be logged by caller
    throw new Error(`Gemini API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Parse JSON from response (handle potential markdown code blocks)
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const extracted = JSON.parse(jsonStr);
    return {
      success: true,
      clientName: extracted.clientName,
      clientGender: extracted.clientGender,
      clientBirthday: extracted.clientBirthday,
      labName: extracted.labName,
      orderingDoctor: extracted.orderingDoctor,
      testDate: extracted.testDate,
      biomarkers: extracted.biomarkers || [],
      extractionConfidence: 0.8,
      verificationPassed: false, // Backwards compatibility
      verificationStatus: 'failed',
    };
  } catch {
    throw new Error('Failed to parse extraction result from Gemini');
  }
}

// Stage 2: GPT-5.2 verification (reasoning: high)
async function verifyWithGPT(
  pdfBase64: string,
  extractedData: ExtractionResult
): Promise<ExtractionResult> {
  if (!OPENAI_API_KEY) {
    // If OpenAI not configured, return unverified result
    // Note: This is logged at the API handler level
    return extractedData;
  }

  const extractedJson = JSON.stringify(
    {
      clientName: extractedData.clientName,
      clientGender: extractedData.clientGender,
      clientBirthday: extractedData.clientBirthday,
      labName: extractedData.labName,
      orderingDoctor: extractedData.orderingDoctor,
      testDate: extractedData.testDate,
      biomarkers: extractedData.biomarkers,
    },
    null,
    2
  );

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
4. For EACH biomarker in the JSON, verify against the PDF:
   - Name: Must be in standard English medical terminology (translate if needed, e.g., "Cholesterol toàn phần" → "Total Cholesterol", "Đường huyết" → "Glucose")
   - Value: Must be exactly correct (check decimal points carefully)
   - Unit: Must match the primary unit shown in PDF
   - Secondary value/unit: If PDF shows values in multiple units (e.g., both mg/dL and mmol/L), these should be captured
   - Reference range: Min and max values must match PDF
   - Flag: Must be correct (high/low/normal) based on value vs reference range
   - isQualitative: Must be true for qualitative results (Negative/Positive/Trace/etc.)

## URINALYSIS VERIFICATION:
- **Dipstick results** must have string values ("Negative", "Positive", etc.) and isQualitative: true
- **Microscopy results** must have numeric values with units like /μL or cells/HPF
- Vietnamese: Âm Tính = Negative, Dương Tính = Positive, Bình thường = Normal
- If PDF shows BOTH dipstick AND microscopy for the same parameter (e.g., Blood), verify BOTH are extracted

## Response Format:
Return ONLY valid JSON (no markdown code blocks) with the corrected/verified data:
{
  "clientName": "verified or corrected value",
  "clientGender": "male" or "female" or "other",
  "clientBirthday": "YYYY-MM-DD",
  "labName": "verified or corrected value",
  "orderingDoctor": "verified or corrected value",
  "testDate": "YYYY-MM-DD",
  "biomarkers": [
    {
      "name": "English name",
      "value": 123.4 or "Negative",
      "unit": "original unit from PDF",
      "secondaryValue": 6.8,
      "secondaryUnit": "alternative unit if shown",
      "referenceMin": 0,
      "referenceMax": 100,
      "flag": "high" or "low" or "normal",
      "isQualitative": true or false
    }
  ],
  "corrections": ["List each correction made, e.g., 'Fixed Glucose value from 95 to 96', or empty array if none"]
}

NOTE: If corrections array is empty, the extraction was clean. If corrections were made, they have been applied successfully.`;

  // Set up timeout with AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

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
        dispatcher: longTimeoutAgent,
        body: JSON.stringify({
          model: 'gpt-5.2',
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
          max_output_tokens: 32000, // Reduced from 128000
          reasoning: {
            effort: 'high',
            summary: 'auto',
          },
        }),
      });
    } catch (fetchError) {
      if (fetchError instanceof Error) {
        // Handle AbortError (manual timeout) or BodyTimeoutError (undici body timeout)
        if (fetchError.name === 'AbortError' || (fetchError as { code?: string }).code === 'UND_ERR_BODY_TIMEOUT') {
          return {
            ...extractedData,
            verificationPassed: false, // Backwards compatibility
            verificationStatus: 'failed' as VerificationStatus,
            corrections: ['Verification timed out after 10 minutes - returning unverified extraction'],
          };
        }
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      // Return unverified if GPT fails with clear message
      return {
        ...extractedData,
        verificationPassed: false, // Backwards compatibility
        verificationStatus: 'failed' as VerificationStatus,
        corrections: [`GPT verification failed with HTTP ${response.status} - returning unverified extraction`],
      };
    }

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Return unverified if response is not valid JSON
      return {
        ...extractedData,
        verificationPassed: false, // Backwards compatibility
        verificationStatus: 'failed' as VerificationStatus,
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
      // Return unverified if no content extracted
      return {
        ...extractedData,
        verificationPassed: false, // Backwards compatibility
        verificationStatus: 'failed' as VerificationStatus,
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
      // Return unverified if GPT content is not valid JSON
      return {
        ...extractedData,
        verificationPassed: false, // Backwards compatibility
        verificationStatus: 'failed' as VerificationStatus,
        corrections: ['GPT output was not valid JSON - returning unverified extraction'],
      };
    }

    // Determine verification status based on corrections
    const corrections: string[] = verified.corrections || [];
    const verificationStatus: VerificationStatus = corrections.length === 0 ? 'clean' : 'corrected';

    return {
      success: true,
      clientName: verified.clientName,
      clientGender: verified.clientGender,
      clientBirthday: verified.clientBirthday,
      labName: verified.labName,
      orderingDoctor: verified.orderingDoctor,
      testDate: verified.testDate,
      biomarkers: verified.biomarkers || extractedData.biomarkers,
      extractionConfidence: 0.95, // High confidence since verification succeeded
      verificationPassed: true, // Backwards compatibility - verification succeeded
      verificationStatus,
      corrections,
    };
  } catch (error) {
    // Return unverified extraction if GPT fails
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      ...extractedData,
      verificationPassed: false, // Backwards compatibility
      verificationStatus: 'failed' as VerificationStatus,
      corrections: [`GPT verification error: ${errorMessage} - returning unverified extraction`],
    };
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

// SSE event types
type SSEEventType = 'stage' | 'complete' | 'error';

interface SSEEvent {
  type: SSEEventType;
  stage?: 'fetching_pdf' | 'extracting_gemini' | 'verifying_gpt';
  data?: ExtractionResult;
  error?: string;
  biomarkerCount?: number;
}

function sendSSE(res: VercelResponse, event: SSEEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

async function handler(req: LoggedRequest, res: VercelResponse) {
  const log = req.log.child('Extraction');
  log.info('Request received', { method: req.method, acceptSSE: req.headers.accept?.includes('text/event-stream') });

  // CORS headers
  const allowedOrigin = getAllowedOrigin(req);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    log.debug('Handling OPTIONS preflight');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    log.warn('Method not allowed', { method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    log.warn('No authorization header');
    return res.status(401).json({ error: 'Authorization required' });
  }

  // Check if client wants SSE (streaming)
  const acceptsSSE = req.headers.accept?.includes('text/event-stream');

  if (acceptsSSE) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.status(200);
  }

  const startTime = Date.now();
  log.info('Starting lab result extraction', { sseMode: acceptsSSE });

  try {
    const supabase = createSupabaseClient(authHeader);
    const userId = await getUserId(supabase, authHeader);

    const { storagePath } = req.body;

    if (!storagePath) {
      if (acceptsSSE) {
        sendSSE(res, { type: 'error', error: 'storagePath is required' });
        return res.end();
      }
      return res.status(400).json({ error: 'storagePath is required' });
    }

    // SECURITY: Validate storagePath belongs to authenticated user
    // Storage path format: {userId}/{fileId}.pdf
    if (!storagePath.startsWith(`${userId}/`)) {
      log.error('SECURITY: Unauthorized access attempt', undefined, {
        userId,
        requestedPath: storagePath,
      });
      if (acceptsSSE) {
        sendSSE(res, { type: 'error', error: 'Unauthorized access to file' });
        return res.end();
      }
      return res.status(403).json({ error: 'Unauthorized access to file' });
    }

    // Stage 0: Fetch PDF
    log.info('Fetching PDF from storage', { storagePath });
    if (acceptsSSE) {
      sendSSE(res, { type: 'stage', stage: 'fetching_pdf' });
    }
    const fetchStart = Date.now();
    const pdfBase64 = await fetchPDFAsBase64(supabase, storagePath);
    const pdfSizeKB = (pdfBase64.length * 0.75 / 1024).toFixed(1);
    log.debug('PDF fetched', { pdfSizeKB, durationMs: Date.now() - fetchStart });

    // Stage 1: Extract with Gemini
    log.info('Stage 1: Extracting with Gemini');
    if (acceptsSSE) {
      sendSSE(res, { type: 'stage', stage: 'extracting_gemini' });
    }
    const stage1Start = Date.now();
    const extractedData = await extractWithGemini(pdfBase64);
    const stage1Duration = Date.now() - stage1Start;

    if (!extractedData.success) {
      log.error('Stage 1 FAILED - extraction unsuccessful');
      if (acceptsSSE) {
        sendSSE(res, { type: 'error', error: 'Extraction failed' });
        return res.end();
      }
      return res.status(500).json({
        success: false,
        error: 'Extraction failed',
      });
    }

    log.info('Stage 1 complete', {
      durationMs: stage1Duration,
      clientName: extractedData.clientName || 'N/A',
      labName: extractedData.labName || 'N/A',
      testDate: extractedData.testDate || 'N/A',
      biomarkerCount: extractedData.biomarkers.length,
    });

    // Stage 2: Verify with GPT
    log.info('Stage 2: Verifying with GPT');
    if (acceptsSSE) {
      sendSSE(res, { type: 'stage', stage: 'verifying_gpt', biomarkerCount: extractedData.biomarkers.length });
    }
    const stage2Start = Date.now();
    const verifiedData = await verifyWithGPT(pdfBase64, extractedData);
    const stage2Duration = Date.now() - stage2Start;

    const correctionsCount = verifiedData.corrections?.length || 0;
    log.info('Stage 2 complete', {
      durationMs: stage2Duration,
      verificationStatus: verifiedData.verificationStatus,
      correctionsCount,
      corrections: verifiedData.corrections,
      finalBiomarkerCount: verifiedData.biomarkers.length,
      confidence: `${(verifiedData.extractionConfidence * 100).toFixed(0)}%`,
    });

    // Summary
    const totalTime = Date.now() - startTime;
    log.info('Extraction COMPLETE', {
      totalTimeMs: totalTime,
      pdfFetchMs: Date.now() - fetchStart - stage1Duration - stage2Duration,
      stage1Ms: stage1Duration,
      stage2Ms: stage2Duration,
      biomarkerCount: verifiedData.biomarkers.length,
      verificationStatus: verifiedData.verificationStatus,
    });

    if (acceptsSSE) {
      sendSSE(res, { type: 'complete', data: verifiedData });
      return res.end();
    }
    return res.status(200).json(verifiedData);
  } catch (error) {
    const totalTime = Date.now() - startTime;
    log.error('Extraction FAILED', error, { totalTimeMs: totalTime });

    const errorMessage = error instanceof Error ? error.message : 'Extraction failed';

    if (acceptsSSE) {
      sendSSE(res, { type: 'error', error: errorMessage });
      return res.end();
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

export default withLogger(handler);
