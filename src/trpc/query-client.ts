import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

// Ensure QueryClient has defaultQueryOptions for TRPC compatibility (React Query v5 removed it).
// Mimic the v4 behavior: merge provided options onto the client's default query options.
(QueryClient.prototype as any).defaultQueryOptions ??= function (options?: any) {
  const defaults = this.getDefaultOptions().queries ?? {};
  return { ...defaults, ...(options ?? {}) };
};

class PatchedQueryClient extends QueryClient {
  defaultQueryOptions(options?: any) {
    const defaults = this.getDefaultOptions().queries ?? {};
    return { ...defaults, ...(options ?? {}) };
  }
}

const createQueryClient = () =>
  {
    const client = new PatchedQueryClient({
      defaultOptions: {
        queries: {
          // With SSR, we usually want to set some default staleTime
          // above 0 to avoid refetching immediately on the client
          staleTime: 30 * 1000,
        },
        dehydrate: {
          serializeData: SuperJSON.serialize,
          shouldDehydrateQuery: (query) =>
            defaultShouldDehydrateQuery(query) ||
            query.state.status === "pending",
        },
        hydrate: {
          deserializeData: SuperJSON.deserialize,
        },
      },
    });

    return client;
  };

let clientQueryClientSingleton: QueryClient | undefined = undefined;

export const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= createQueryClient());
};
