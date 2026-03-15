import { createClient } from '@supabase/supabase-js';

/**
 * Server-side only Supabase client using the service role key.
 * NEVER import this in client components — the service role key
 * must stay server-side only (API routes / server actions).
 */
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
