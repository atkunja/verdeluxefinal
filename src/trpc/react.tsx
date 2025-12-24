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
  const isBrowser = typeof window !== "undefined";
  console.log(`[tRPC] getBaseUrl check. isBrowser: ${isBrowser}`);

  if (isBrowser) {
    console.log(`[tRPC] Browser detected, using origin: ${window.location.origin}`);
    return window.location.origin;
  }

  // Server-side (during SSR or build)
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    console.log(`[tRPC] Server detected, VERCEL_URL found: ${url}`);
    return url;
  }

  const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BASE_URL ||
    import.meta.env.BASE_URL;

  console.log(`[tRPC] Server detected, VERCEL_URL missing. apiBase: ${apiBase}`);

  // In the browser, if we are NOT on localhost, we should ignore any apiBase that points to localhost
  if (isBrowser && !window.location.hostname.includes("localhost")) {
    if (apiBase && apiBase.includes("localhost")) {
      console.warn(`[tRPC] Ignoring localhost apiBase "${apiBase}" because we are on ${window.location.origin}`);
      return window.location.origin;
    }
  }

  if (apiBase && !apiBase.includes("localhost")) return apiBase as string;

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
                return token ? { Authorization: `Bearer ${token}` } : {};
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
