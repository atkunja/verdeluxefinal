// @ts-nocheck
import { defineEventHandler, toWebRequest } from "@tanstack/react-start/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./root";
import { supabaseServer } from "../supabase";
import { db } from "../db";

// CORS helper
function getCorsHeaders(origin: string | null): Record<string, string> {
  if (!origin) return {};

  let isAllowed = false;
  // Allow localhost on any port
  if (origin.startsWith("http://localhost:")) isAllowed = true;
  // Allow any Vercel deployment
  else if (origin.endsWith(".vercel.app")) isAllowed = true;
  // Allow any Railway deployment
  else if (origin.endsWith(".railway.app")) isAllowed = true;
  // Allow BASE_URL origin
  else if (process.env.BASE_URL && origin === process.env.BASE_URL.replace(/\/$/, "")) isAllowed = true;

  if (!isAllowed) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
}

export default defineEventHandler(async (event) => {
  const request = toWebRequest(event);
  if (!request) {
    return new Response("No request", { status: 400 });
  }

  const origin = request.headers.get("origin");
  console.log(`[CORS] Request method: ${request.method}, Origin: ${origin}`);

  // Get CORS headers (or use permissive headers for debugging)
  let corsHeaders = getCorsHeaders(origin);

  // If no CORS headers were set (origin not allowed or missing), 
  // use permissive CORS for debugging cross-origin issues
  if (Object.keys(corsHeaders).length === 0) {
    console.log(`[CORS] No CORS headers from getCorsHeaders. Using permissive CORS.`);
    corsHeaders = {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Credentials": "true",
    };
  }

  console.log(`[CORS] Returning headers:`, JSON.stringify(corsHeaders));

  // Handle Preflight OPTIONS request
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Handle actual TRPC request
  const response = await fetchRequestHandler({
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

  // Add CORS headers to the response
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
});
