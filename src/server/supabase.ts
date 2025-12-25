import { createClient } from "@supabase/supabase-js";
// import { env } from "./env";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client for auth/admin operations.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseServer = (supabaseUrl && supabaseKey)
  ? createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
  : null as any;

if (!supabaseServer) {
  console.error("❌ Supabase Server Client failed to initialize: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("Values:", { url: !!supabaseUrl, key: !!supabaseKey });
}
