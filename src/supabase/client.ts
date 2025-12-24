import { createClient } from "@supabase/supabase-js";
import { env } from "../env";

// Browser-side Supabase client for auth/session-aware operations.
export const supabaseBrowser = createClient(
  env.VITE_SUPABASE_URL!,
  env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
