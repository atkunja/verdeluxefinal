import { z } from "zod";

/**
 * Client-side environment variables.
 * These must be prefixed with VITE_ to be available in the browser.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
});

// Try to find the values in various potential sources
const getEnvValue = (key: string) => {
  // 1. Check import.meta.env (Vite standard)
  if (import.meta.env && import.meta.env[key]) return import.meta.env[key];

  // 2. Check process.env (Node fallback/polyfill)
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];

  return undefined;
};

const envSource = {
  VITE_SUPABASE_URL: getEnvValue("VITE_SUPABASE_URL"),
  VITE_SUPABASE_ANON_KEY: getEnvValue("VITE_SUPABASE_ANON_KEY"),
};

const parsed = envSchema.safeParse(envSource);

export const env = parsed.success ? parsed.data : {
  VITE_SUPABASE_URL: undefined,
  VITE_SUPABASE_ANON_KEY: undefined,
} as any;

if (!parsed.success) {
  console.warn("⚠️ Client-side environment variables missing or invalid. Check your Vercel/Railway settings.");
} else if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
  // If they are optional in schema but missing in reality
  console.warn("⚠️ Supabase keys are missing from the environment. Image uploads will be disabled.");
}
