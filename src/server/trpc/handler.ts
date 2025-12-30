// @ts-nocheck
import { defineEventHandler, toWebRequest, setResponseHeader } from "@tanstack/react-start/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./root";
import { supabaseServer } from "../supabase";
import { db } from "../db";

export default defineEventHandler((event) => {
  const request = toWebRequest(event);
  if (!request) {
    return new Response("No request", { status: 400 });
  }

  // CORS Configuration
  const validOrigins = [
    process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, "") : null, // Remove trailing slash if present
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://verdeluxefinal.vercel.app", // Fallback hardcoded if needed
  ].filter(Boolean);

  const origin = request.headers.get("origin");
  const isAllowedOrigin = origin && validOrigins.includes(origin);

  // Helper to set CORS headers
  const setCorsHeaders = () => {
    if (isAllowedOrigin && origin) {
      setResponseHeader(event, "Access-Control-Allow-Origin", origin);
      setResponseHeader(event, "Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      setResponseHeader(event, "Access-Control-Allow-Headers", "authorization, content-type");
      setResponseHeader(event, "Access-Control-Allow-Credentials", "true");
    }
  };

  // Handle Preflight OPTIONS request
  if (request.method === "OPTIONS") {
    setCorsHeaders();
    return new Response(null, { status: 204 });
  }

  // Handle actual request
  setCorsHeaders();

  return fetchRequestHandler({
    endpoint: "/trpc",
    req: request,
    router: appRouter,
    async createContext() {
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7)
        : null;

      console.log(`[tRPC] Request to endpoint from handler. Token present: ${!!token}`);
      if (!token) {
        console.log(`[tRPC] No token found in authorization header: "${authHeader}"`);
      }

      let authUser: { id: string; email: string | null } | null = null;
      let profile: {
        id: number;
        email: string;
        role: string;
        firstName: string | null;
        lastName: string | null;
        adminPermissions: Record<string, boolean> | null;
      } | null = null;

      if (token) {
        let candidateEmail: string | null = null;
        let candidateId: string | null = null;

        // Primary: verify token with Supabase
        try {
          if (supabaseServer) {
            const { data } = await supabaseServer.auth.getUser(token);
            candidateEmail = data?.user?.email ?? null;
            candidateId = data?.user?.id ?? null;
          } else {
            console.error("Supabase server client not available for token verification");
          }
        } catch (err) {
          console.error("Supabase auth.getUser failed, attempting decode fallback", err);
        }

        // Fallback: decode JWT without verification (useful for stale/invalid tokens in dev)
        const decoded =
          candidateEmail || candidateId
            ? null
            : (() => {
              try {
                return JSON.parse(
                  Buffer.from(token.split(".")[1] ?? "", "base64").toString("utf8"),
                ) as { email?: string };
              } catch {
                return null;
              }
            })();

        const email = candidateEmail ?? decoded?.email ?? null;
        const id = candidateId ?? "";

        if (email) {
          console.log(`[tRPC] Looking up dbUser for email: "${email}" (case-insensitive)`);
          authUser = { id, email };
          // Use findFirst with insensitive mode for casing resilience
          const dbUser = await db.user.findFirst({
            where: {
              email: {
                equals: email,
                mode: 'insensitive'
              }
            },
            select: {
              id: true,
              email: true,
              role: true,
              firstName: true,
              lastName: true,
              adminPermissions: true,
            },
          });
          if (dbUser) {
            console.log(`[tRPC] dbUser found. ID: ${dbUser.id}, Role: ${dbUser.role}`);
            profile = dbUser as typeof profile;
          } else {
            console.log(`[tRPC] No dbUser found for email: "${email}"`);
          }
        } else {
          console.log("[tRPC] No email found in token/decoded.");
        }
      } else {
        console.log("[tRPC] No token present in request.");
      }

      return { authUser, profile, token };
    },
    onError({ error, path }) {
      console.error(`tRPC error on '${path}':`, error);
    },
  });
});
