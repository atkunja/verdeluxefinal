import { createClient } from "@supabase/supabase-js";
import { env } from "../env";

// Browser-side Supabase client for auth/session-aware operations.
// Only initialize if the URL and Key are provided to avoid runtime crashes.
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

export const supabaseBrowser = (supabaseUrl && supabaseKey)
  ? createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  )
  : null as any;

if (!supabaseBrowser) {
  console.warn("⚠️ Supabase Browser Client failed to initialize: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}
