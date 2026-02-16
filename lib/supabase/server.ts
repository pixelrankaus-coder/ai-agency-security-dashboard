// lib/supabase/server.ts
// Server client for API routes and server components
// Uses service role key and can bypass Row Level Security (RLS) when needed

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      `Supabase credentials missing: URL=${!!url}, KEY=${!!key}`
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
