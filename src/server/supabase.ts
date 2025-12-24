import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Server-side Supabase client for auth/admin operations.
export const supabaseServer = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
