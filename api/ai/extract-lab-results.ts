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

  const prompt = `You are verifying a lab result extraction. Compare the extracted JSON data against the original PDF.

EXTRACTED DATA:
${extractedJson}

Review the extraction for accuracy:
1. Verify patient name, gender, and birthday match the PDF exactly
2. Verify lab name and ordering doctor match
3. Check test date is correct
4. For EACH biomarker, verify:
   - Name is in standard English medical terminology (translate if needed, e.g., "Cholesterol toàn phần" → "Total Cholesterol")
   - Value is exactly correct (check decimal points)
   - Unit is correct (keep original from PDF)
   - Secondary value/unit captured if PDF shows alternative units
   - Reference range is correct
   - Flag (high/low/normal) is correct based on value vs range

Return ONLY valid JSON (no markdown) in this format:
{
  "clientName": "corrected or same",
  "clientGender": "male" or "female" or "other",
  "clientBirthday": "YYYY-MM-DD",
  "labName": "corrected or same",
  "orderingDoctor": "corrected or same",
  "testDate": "YYYY-MM-DD",
  "biomarkers": [...corrected array with English names, original units, and secondary values if present...],
  "corrections": ["Description of correction 1", "Description of correction 2"],
  "verificationPassed": true or false
}

If biomarker names are not in English, translate them to standard medical terminology.
Keep original units from PDF. Include secondary value/unit if PDF shows alternative units.
If extraction is accurate, set corrections to empty array and verificationPassed to true.
If you made corrections, list them and set verificationPassed to true (since now corrected).
Only set verificationPassed to false if the PDF is unreadable or data cannot be verified.`;

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
              { type: 'input_text', text: prompt },
              {
                type: 'input_image',
                image_url: `data:application/pdf;base64,${pdfBase64}`,
              },
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
      console.error('OpenAI API error:', errorText);
      // Return unverified if GPT fails
      return extractedData;
    }

    const data = await response.json();

    // Extract content from Responses API format
    const content = data.output
      ?.filter((item: { type: string }) => item.type === 'message')
      ?.flatMap((item: { content: Array<{ type: string; text?: string }> }) => item.content)
      ?.filter((part: { type: string }) => part.type === 'output_text')
      ?.map((part: { text?: string }) => part.text)
      ?.join('') || '';

    // Parse JSON from response
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const verified = JSON.parse(jsonStr);

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  try {
    const supabase = createSupabaseClient(authHeader);
    await getUserId(supabase, authHeader);

    const { storagePath } = req.body;

    if (!storagePath) {
      return res.status(400).json({ error: 'storagePath is required' });
    }

    // Stage 0: Fetch PDF
    console.log('Fetching PDF from storage...');
    const pdfBase64 = await fetchPDFAsBase64(supabase, storagePath);

    // Stage 1: Extract with Gemini
    console.log('Stage 1: Extracting with Gemini...');
    const extractedData = await extractWithGemini(pdfBase64);

    if (!extractedData.success) {
      return res.status(500).json({
        success: false,
        error: 'Extraction failed',
      });
    }

    // Stage 2: Verify with GPT
    console.log('Stage 2: Verifying with GPT...');
    const verifiedData = await verifyWithGPT(pdfBase64, extractedData);

    return res.status(200).json(verifiedData);
  } catch (error) {
    console.error('Lab result extraction error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Extraction failed',
    });
  }
}
