import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client-side Supabase client (uses anon key, respects RLS)
// Lazy-init to avoid build-time errors when env vars aren't set
let _clientInstance: ReturnType<typeof createClient> | null = null;
export function getSupabaseClient() {
  if (!_clientInstance && supabaseUrl && supabaseAnonKey) {
    _clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _clientInstance;
}
// Backwards compat — only safe to use at runtime, not at build time
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as ReturnType<typeof createClient>);

// Server-side Supabase client (uses service role key, bypasses RLS)
// Use this ONLY in API routes, never expose to the client
export function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are not set');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}
