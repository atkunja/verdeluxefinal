import { defineEventHandler } from "@tanstack/react-start/server";
// import { db } from "../db";
// import { env } from "../env";

export default defineEventHandler(async (event) => {
    const result = {
        status: "ok",
        env: {
            NODE_ENV: process.env.NODE_ENV,
            DATABASE_URL_SET: !!process.env.DATABASE_URL,
            SUPABASE_URL_SET: !!process.env.SUPABASE_URL,
            VERCEL_URL: process.env.VERCEL_URL,
            // Manual check of env var to see if it's there without importing schema
        },
        db: "skipped",
        error: null as any,
    };

    /*
    try {
      const count = await db.user.count();
      result.db = `Connected! User count: ${count}`;
    } catch (e) {
      result.status = "error";
      result.error = e instanceof Error ? e.message : String(e);
      console.error("Health check DB failed:", e);
    }
    */

    return new Response(JSON.stringify(result, null, 2), {
        headers: { "Content-Type": "application/json" },
    });
});
