import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
  verificationPassed: boolean;
  corrections?: string[];
  error?: string;
}

// Server-side API keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

// Supabase client
function createSupabaseClient(authHeader: string | undefined) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
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
- TRANSLATE all biomarker names to standard English medical terminology (e.g., "Cholesterol toàn phần" → "Total Cholesterol", "Đường huyết" → "Glucose", "Hồng cầu" → "RBC")
- Use standard abbreviations where appropriate (e.g., LDL, HDL, TSH, HbA1c, ALT, AST, WBC, RBC)
- Keep the ORIGINAL unit from the PDF as "unit"
- If PDF shows a secondary value with different unit (e.g., both mg/dL and mmol/L), include as "secondaryValue" and "secondaryUnit"
- Parse numeric values correctly (remove commas, handle decimals)
- Determine flag based on reference range if not explicitly stated
- If a field is not found, omit it from the response
- Return ONLY the JSON object, nothing else`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status}`);
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
      verificationPassed: false,
    };
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', content);
    throw new Error('Failed to parse extraction result');
  }
}

// Stage 2: GPT-5.1 verification (reasoning: high)
async function verifyWithGPT(
  pdfBase64: string,
  extractedData: ExtractionResult
): Promise<ExtractionResult> {
  if (!OPENAI_API_KEY) {
    // If OpenAI not configured, return unverified result
    console.warn('OpenAI API key not configured, skipping verification');
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
      "value": 123.4,
      "unit": "original unit from PDF",
      "secondaryValue": 6.8,
      "secondaryUnit": "alternative unit if shown",
      "referenceMin": 0,
      "referenceMax": 100,
      "flag": "high" or "low" or "normal"
    }
  ],
  "corrections": ["List each correction made, e.g., 'Fixed Glucose value from 95 to 96'"],
  "verificationPassed": true
}

## Important:
- If extraction is accurate, set corrections to empty array []
- If you made corrections, list each one clearly in the corrections array
- Set verificationPassed to true if data is now accurate (even if corrections were needed)
- Only set verificationPassed to false if the PDF is unreadable or data cannot be verified`;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
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
        max_output_tokens: 128000,
        reasoning: {
          effort: 'high',
          summary: 'auto',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      // Return unverified if GPT fails
      return extractedData;
    }

    const responseText = await response.text();
    console.log('GPT raw response length:', responseText.length);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse GPT response as JSON:', responseText.substring(0, 500));
      return extractedData;
    }

    // Extract content from Responses API format
    const content = data.output
      ?.filter((item: { type: string }) => item.type === 'message')
      ?.flatMap((item: { content: Array<{ type: string; text?: string }> }) => item.content)
      ?.filter((part: { type: string }) => part.type === 'output_text')
      ?.map((part: { text?: string }) => part.text)
      ?.join('') || '';

    if (!content) {
      console.error('No content extracted from GPT response:', JSON.stringify(data, null, 2).substring(0, 1000));
      return extractedData;
    }

    console.log('GPT extracted content length:', content.length);

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
    } catch (parseErr) {
      console.error('Failed to parse GPT content as JSON:', jsonStr.substring(0, 500));
      return extractedData;
    }

    return {
      success: true,
      clientName: verified.clientName,
      clientGender: verified.clientGender,
      clientBirthday: verified.clientBirthday,
      labName: verified.labName,
      orderingDoctor: verified.orderingDoctor,
      testDate: verified.testDate,
      biomarkers: verified.biomarkers || extractedData.biomarkers,
      extractionConfidence: verified.verificationPassed ? 0.95 : 0.7,
      verificationPassed: verified.verificationPassed ?? true,
      corrections: verified.corrections || [],
    };
  } catch (error) {
    console.error('GPT verification error:', error);
    // Return unverified extraction if GPT fails
    return extractedData;
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[Extraction] Request received');
  console.log('[Extraction] Method:', req.method);
  console.log('[Extraction] Accept header:', req.headers.accept);

  // CORS headers
  const allowedOrigin = getAllowedOrigin(req);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    console.log('[Extraction] Handling OPTIONS preflight');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('[Extraction] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('[Extraction] No authorization header');
    return res.status(401).json({ error: 'Authorization required' });
  }

  // Check if client wants SSE (streaming)
  const acceptsSSE = req.headers.accept?.includes('text/event-stream');
  console.log('[Extraction] SSE requested:', acceptsSSE);

  if (acceptsSSE) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.status(200);
  }

  const startTime = Date.now();
  console.log('[Extraction] ========================================');
  console.log('[Extraction] Starting lab result extraction');
  console.log('[Extraction] SSE mode:', acceptsSSE);

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
      console.error('[Extraction] SECURITY: Unauthorized access attempt', {
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
    console.log('[Extraction] Storage path:', storagePath);
    console.log('[Extraction] Fetching PDF from Supabase Storage...');
    if (acceptsSSE) {
      sendSSE(res, { type: 'stage', stage: 'fetching_pdf' });
    }
    const fetchStart = Date.now();
    const pdfBase64 = await fetchPDFAsBase64(supabase, storagePath);
    const pdfSizeKB = (pdfBase64.length * 0.75 / 1024).toFixed(1);
    console.log(`[Extraction] PDF fetched: ${pdfSizeKB} KB (${Date.now() - fetchStart}ms)`);

    // Stage 1: Extract with Gemini
    console.log('[Extraction] ----------------------------------------');
    console.log('[Extraction] Stage 1: Sending to Gemini 3 Pro (thinking: high)...');
    if (acceptsSSE) {
      sendSSE(res, { type: 'stage', stage: 'extracting_gemini' });
    }
    const stage1Start = Date.now();
    const extractedData = await extractWithGemini(pdfBase64);
    const stage1Duration = Date.now() - stage1Start;
    console.log(`[Extraction] Stage 1 complete: ${stage1Duration}ms`);

    if (!extractedData.success) {
      console.log('[Extraction] Stage 1 FAILED - extraction unsuccessful');
      if (acceptsSSE) {
        sendSSE(res, { type: 'error', error: 'Extraction failed' });
        return res.end();
      }
      return res.status(500).json({
        success: false,
        error: 'Extraction failed',
      });
    }

    console.log(`[Extraction] Stage 1 results:`);
    console.log(`[Extraction]   - Client: ${extractedData.clientName || 'N/A'}`);
    console.log(`[Extraction]   - Lab: ${extractedData.labName || 'N/A'}`);
    console.log(`[Extraction]   - Test date: ${extractedData.testDate || 'N/A'}`);
    console.log(`[Extraction]   - Biomarkers extracted: ${extractedData.biomarkers.length}`);

    // Stage 2: Verify with GPT
    console.log('[Extraction] ----------------------------------------');
    console.log('[Extraction] Stage 2: Sending to GPT-5.1 for verification (reasoning: high)...');
    if (acceptsSSE) {
      sendSSE(res, { type: 'stage', stage: 'verifying_gpt', biomarkerCount: extractedData.biomarkers.length });
    }
    const stage2Start = Date.now();
    const verifiedData = await verifyWithGPT(pdfBase64, extractedData);
    const stage2Duration = Date.now() - stage2Start;
    console.log(`[Extraction] Stage 2 complete: ${stage2Duration}ms`);

    const correctionsCount = verifiedData.corrections?.length || 0;
    console.log(`[Extraction] Stage 2 results:`);
    console.log(`[Extraction]   - Verification passed: ${verifiedData.verificationPassed}`);
    console.log(`[Extraction]   - Corrections made: ${correctionsCount}`);
    if (correctionsCount > 0) {
      verifiedData.corrections?.forEach((c, i) => {
        console.log(`[Extraction]     ${i + 1}. ${c}`);
      });
    }
    console.log(`[Extraction]   - Final biomarker count: ${verifiedData.biomarkers.length}`);
    console.log(`[Extraction]   - Confidence: ${(verifiedData.extractionConfidence * 100).toFixed(0)}%`);

    // Summary
    const totalTime = Date.now() - startTime;
    console.log('[Extraction] ========================================');
    console.log(`[Extraction] COMPLETE - Total time: ${totalTime}ms`);
    console.log(`[Extraction]   - PDF fetch: ${Date.now() - fetchStart - stage1Duration - stage2Duration}ms`);
    console.log(`[Extraction]   - Stage 1 (Gemini): ${stage1Duration}ms`);
    console.log(`[Extraction]   - Stage 2 (GPT): ${stage2Duration}ms`);
    console.log('[Extraction] ========================================');

    if (acceptsSSE) {
      sendSSE(res, { type: 'complete', data: verifiedData });
      return res.end();
    }
    return res.status(200).json(verifiedData);
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('[Extraction] ========================================');
    console.error(`[Extraction] FAILED after ${totalTime}ms`);
    console.error('[Extraction] Error:', error);
    console.error('[Extraction] ========================================');

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
