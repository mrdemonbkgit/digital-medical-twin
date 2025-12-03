import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Intentional escape hatch - Supabase generics are complex
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseClientAny = SupabaseClient<any, any, any>;

export function createSupabaseClient(authHeader?: string): SupabaseClientAny {
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

export async function getUserId(
  supabase: SupabaseClientAny,
  authHeader: string
): Promise<string> {
  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) throw new Error('Unauthorized');
  return user.id;
}
