import { z } from "zod";

/**
 * Client-side environment variables.
 * These must be prefixed with VITE_ to be available in the browser.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
});

// Use safeParse to avoid crashing the entire app if env vars are missing during build
// We can handle missing vars gracefully in the components that use them.
const parsed = envSchema.safeParse(import.meta.env);

export const env = parsed.success ? parsed.data : {
  VITE_SUPABASE_URL: undefined,
  VITE_SUPABASE_ANON_KEY: undefined,
} as any;

if (!parsed.success) {
  console.warn("⚠️ Client-side environment variables missing or invalid:", parsed.error.format());
}
