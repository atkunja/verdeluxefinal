import { PrismaClient } from "@prisma/client";

import { env } from "./env";

const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set - database operations will fail");
  }
  return new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

let db: ReturnType<typeof createPrismaClient>;
try {
  db = globalForPrisma.prisma ?? createPrismaClient();
} catch (e) {
  console.error("❌ Failed to create Prisma client:", e);
  db = null as any;
}

export { db };

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
