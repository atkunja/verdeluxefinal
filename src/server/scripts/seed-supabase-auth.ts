import "dotenv/config.js";
import { createClient } from "@supabase/supabase-js";
import { env } from "../env";

const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function ensureUser(email: string, password: string) {
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    throw listError;
  }

  const existing = listData?.users?.find((u) => u.email === email);
  if (existing) {
    console.log(`Auth user already exists for ${email}`);
    return existing;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    throw error;
  }

  console.log(`Created Supabase auth user for ${email}`);
  return data.user;
}

async function main() {
  console.log("Seeding Supabase Auth users (owner + sample clients/cleaners)...");

  // Owner uses the ADMIN_PASSWORD from .env
  await ensureUser("owner@example.com", env.ADMIN_PASSWORD);

  // Sample seed users from setup.ts use password "password123"
  await ensureUser("client1@example.com", "password123");
  await ensureUser("client2@example.com", "password123");
  await ensureUser("cleaner1@example.com", "password123");
  await ensureUser("cleaner2@example.com", "password123");

  console.log("Supabase Auth seeding complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
