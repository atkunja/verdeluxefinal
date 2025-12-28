import { z } from "zod";

// Organized and grouped environment validation to keep Supabase + Vercel config clear.
// Safe environment validation that won't crash the server on startup/build
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  OPENPHONE_API_KEY: z.string().optional(),
  OPENPHONE_PHONE_NUMBER: z.string().optional(),
  OPENPHONE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional(), // Browser key
  VITE_GOOGLE_PLACES_KEY: z.string().optional(),
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),
  VITE_API_BASE_URL: z.string().optional(),
  VITE_BASE_URL: z.string().optional(),
  BASE_URL: z.string().optional(),
  BASE_URL_OTHER_PORT: z.string().optional(),
});

// Parse the environment, allowing for missing variables during build/early stages
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables during build/init:", parsed.error.format());
}

// We export the parsed data or a safe empty object if it failed
export const env = parsed.success ? parsed.data : {} as any;

// Helper to check if critical variables are missing at runtime
export const checkCriticalEnv = () => {
  const critical = [
    'DATABASE_URL',
    'DIRECT_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ADMIN_PASSWORD'
  ];
  const missing = critical.filter(k => !env[k]);
  if (missing.length > 0) {
    console.error(`⚠️ Missing critical environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
};
