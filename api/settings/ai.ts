import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Server-side encryption utilities
// Note: In a real deployment, use a secure key management service
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

async function encrypt(text: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Import key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    Buffer.from(key, 'base64'),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, data);

  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return Buffer.from(combined).toString('base64');
}

async function decrypt(encryptedData: string, key: string): Promise<string> {
  const combined = Buffer.from(encryptedData, 'base64');

  // Extract IV and ciphertext
  const iv = combined.subarray(0, 12);
  const ciphertext = combined.subarray(12);

  // Import key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    Buffer.from(key, 'base64'),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    cryptoKey,
    new Uint8Array(ciphertext)
  );

  return new TextDecoder().decode(decrypted);
}

function createSupabaseClient(authHeader: string | undefined) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

async function getUserId(supabase: ReturnType<typeof createClient>, authHeader: string) {
  // Extract the JWT token
  const token = authHeader.replace('Bearer ', '');

  if (!token || token === 'undefined' || token === 'null') {
    console.error('Invalid token received:', token?.substring(0, 20) + '...');
    throw new Error('Unauthorized');
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error) {
    console.error('Supabase auth error:', error.message);
    throw new Error('Unauthorized');
  }

  if (!user) {
    console.error('No user returned from token');
    throw new Error('Unauthorized');
  }

  return user.id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    const supabase = createSupabaseClient(authHeader);
    const userId = await getUserId(supabase, authHeader);

    if (req.method === 'GET') {
      // Get AI settings (never return the actual API key)
      const { data, error } = await supabase
        .from('user_settings')
        .select('ai_provider, ai_model, temperature, encrypted_api_key, encrypted_openai_key, encrypted_google_key')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found
        throw error;
      }

      return res.status(200).json({
        provider: data?.ai_provider || null,
        model: data?.ai_model || null,
        temperature: data?.temperature ?? 0.7,
        hasOpenAIKey: !!data?.encrypted_openai_key,
        hasGoogleKey: !!data?.encrypted_google_key,
        // Deprecated but kept for backward compatibility
        hasApiKey: !!(data?.encrypted_openai_key || data?.encrypted_google_key || data?.encrypted_api_key),
      });
    }

    if (req.method === 'PUT') {
      const { provider, model, temperature, apiKey } = req.body;

      // Validate input
      if (provider && !['openai', 'google'].includes(provider)) {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      if (temperature !== undefined && (temperature < 0 || temperature > 1)) {
        return res.status(400).json({ error: 'Temperature must be between 0 and 1' });
      }

      // Build update object
      const updates: Record<string, unknown> = {
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      if (provider !== undefined) updates.ai_provider = provider;
      if (model !== undefined) updates.ai_model = model;
      if (temperature !== undefined) updates.temperature = temperature;

      // Encrypt API key if provided - store in provider-specific column
      if (apiKey !== undefined && provider) {
        const keyColumn = provider === 'openai' ? 'encrypted_openai_key' : 'encrypted_google_key';
        if (apiKey === null || apiKey === '') {
          updates[keyColumn] = null;
        } else if (ENCRYPTION_KEY) {
          updates[keyColumn] = await encrypt(apiKey, ENCRYPTION_KEY);
        } else {
          return res.status(500).json({ error: 'Encryption not configured' });
        }
      }

      // Upsert settings
      const { error } = await supabase.from('user_settings').upsert(updates, {
        onConflict: 'user_id',
      });

      if (error) {
        throw error;
      }

      // Fetch updated settings to return current state
      const { data: updatedData } = await supabase
        .from('user_settings')
        .select('encrypted_openai_key, encrypted_google_key')
        .eq('user_id', userId)
        .single();

      return res.status(200).json({
        success: true,
        provider: updates.ai_provider,
        model: updates.ai_model,
        temperature: updates.temperature,
        hasOpenAIKey: !!updatedData?.encrypted_openai_key,
        hasGoogleKey: !!updatedData?.encrypted_google_key,
        hasApiKey: !!(updatedData?.encrypted_openai_key || updatedData?.encrypted_google_key),
      });
    }

    if (req.method === 'DELETE') {
      // Clear API key for specific provider
      const providerToClear = req.query.provider as string;

      if (!providerToClear || !['openai', 'google'].includes(providerToClear)) {
        return res.status(400).json({ error: 'Provider parameter required (openai or google)' });
      }

      const keyColumn = providerToClear === 'google' ? 'encrypted_google_key' : 'encrypted_openai_key';

      const { error } = await supabase
        .from('user_settings')
        .update({
          [keyColumn]: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // Fetch updated settings to return current state
      const { data: updatedData } = await supabase
        .from('user_settings')
        .select('encrypted_openai_key, encrypted_google_key')
        .eq('user_id', userId)
        .single();

      return res.status(200).json({
        success: true,
        hasOpenAIKey: !!updatedData?.encrypted_openai_key,
        hasGoogleKey: !!updatedData?.encrypted_google_key,
        hasApiKey: !!(updatedData?.encrypted_openai_key || updatedData?.encrypted_google_key),
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('AI Settings API error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
