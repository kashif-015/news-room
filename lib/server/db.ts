import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let supabaseClient: SupabaseClient | null = null;

export function isDbConfigured(): boolean {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return false;
  const isDummyUrl =
    env.SUPABASE_URL.includes('dummy-project') ||
    env.SUPABASE_URL.includes('your-project') ||
    !env.SUPABASE_URL.startsWith('http');
  const isDummyKey =
    env.SUPABASE_SERVICE_ROLE_KEY.includes('dummy-service-role-key') ||
    env.SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase-service-role-key');
  return !isDummyUrl && !isDummyKey;
}

export function getDb(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}
