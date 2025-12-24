import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Server-side Supabase client for auth/admin operations.
export const supabaseServer = (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
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
}
