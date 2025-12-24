import { z } from "zod";

// Organized and grouped environment validation to keep Supabase + Vercel config clear.
const envSchema = z.object({
  // App + hosting
  NODE_ENV: z.enum(["development", "production"]),
  BASE_URL: z.string().optional(),
  BASE_URL_OTHER_PORT: z.string().optional(),

  // Database (Supabase)
  DATABASE_URL: z.string().url(), // pooled
  DIRECT_URL: z.string().url(), // non-pooled for Prisma
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),

  // Auth
  ADMIN_PASSWORD: z.string(), // seeds owner account
  JWT_SECRET: z.string(),

  // OpenPhone
  OPENPHONE_API_KEY: z.string(),
  OPENPHONE_PHONE_NUMBER: z.string(),
  OPENPHONE_USER_ID: z.string().optional(),
  OPENPHONE_NUMBER_ID: z.string().optional(),


  // Stripe
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_PUBLISHABLE_KEY: z.string(),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),

  // Mercury
  MERCURY_API_KEY: z.string().optional(),
  MERCURY_API_BASE: z.string().url().optional(),

  // Billing/fees
  CANCELLATION_FEE_PERCENT: z.string().optional(),

  // Storage
  STORAGE_BUCKET_BOOKING_PHOTOS: z.string().optional(),
});

export const env = envSchema.parse(process.env);
