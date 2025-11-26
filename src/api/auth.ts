import { supabase } from '@/lib/supabase';
import type { User, LoginCredentials, RegisterCredentials } from '@/types';

function mapSupabaseUser(supabaseUser: { id: string; email?: string; created_at: string }): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    createdAt: supabaseUser.created_at,
  };
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Login failed');
  }

  return mapSupabaseUser(data.user);
}

export async function register(credentials: RegisterCredentials): Promise<User> {
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Registration failed');
  }

  return mapSupabaseUser(data.user);
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  return mapSupabaseUser(session.user);
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ? mapSupabaseUser(session.user) : null;
    callback(user);
  });
}
