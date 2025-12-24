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
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BASE_URL ||
    import.meta.env.BASE_URL;

  if (apiBase) return apiBase as string;
  if (typeof window !== "undefined") return window.location.origin;
  return `http://localhost:3000`;
}

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const token = useAuthStore((state) => state.token);

  const trpcClient = useMemo(
    () =>
      createTRPCClient<AppRouter>({
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
              url: getBaseUrl() + "/trpc",
              headers() {
                return token ? { Authorization: `Bearer ${token}` } : {};
              },
            }),
            true: httpSubscriptionLink({
              transformer: SuperJSON,
              url: getBaseUrl() + "/trpc",
            }),
          }),
        ],
      }),
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
