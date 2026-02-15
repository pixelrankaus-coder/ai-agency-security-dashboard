// lib/supabase/server.ts
// Server client for API routes and server components
// Uses service role key and can bypass Row Level Security (RLS) when needed

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
