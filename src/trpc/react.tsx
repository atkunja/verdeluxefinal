import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  loggerLink,
  splitLink,
  httpBatchStreamLink,
  httpSubscriptionLink,
  createTRPCClient,
} from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useMemo } from "react";
import SuperJSON from "superjson";

import type { AppRouter } from "~/server/trpc/root";
import { getQueryClient } from "./query-client";
import { useAuthStore } from "~/stores/authStore";

// Now, with the newer @trpc/tanstack-react-query package, we no longer need createTRPCReact.
// We use createTRPCContext instead.
const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();

export { useTRPC, useTRPCClient };

function getBaseUrl() {
  if (typeof window !== "undefined") {
    // If VITE_API_URL is set, use it (split environment)
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    // Otherwise use relative path (same origin)
    return "";
  }
  // Server-side
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:3000`;
}

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const token = useAuthStore((state) => state.token);

  const trpcClient = useMemo(
    () => {
      const url = getBaseUrl() + "/trpc";
      console.log(`[tRPC] Creating client with URL: ${url}`);
      return createTRPCClient<AppRouter>({
        links: [
          loggerLink({
            enabled: (op) =>
              process.env.NODE_ENV === "development" ||
              (op.direction === "down" && op.result instanceof Error),
          }),
          splitLink({
            condition: (op) => op.type === "subscription",
            false: httpBatchStreamLink({
              transformer: SuperJSON,
              url,
              headers() {
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                console.log(`[tRPC] Sending headers:`, { hasToken: !!token, tokenLength: token?.length, url });
                return headers;
              },
              fetch(url, options) {
                return fetch(url, {
                  ...options,
                  credentials: 'include',
                } as RequestInit);
              },
            }),
            true: httpSubscriptionLink({
              transformer: SuperJSON,
              url,
            }),
          }),
        ],
      });
    },
    [token],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
// force rebuild Wed Dec 24 18:24:57 EST 2025
