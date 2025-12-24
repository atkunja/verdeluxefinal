import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

export type TRPCContext = {
  authUser: {
    id: string;
    email: string | null;
  } | null;
  profile:
    | {
        id: number;
        email: string;
        role: string;
        firstName: string | null;
        lastName: string | null;
        adminPermissions: Record<string, boolean> | null;
      }
    | null;
  token: string | null;
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  sse: {
    enabled: true,
    client: {
      reconnectAfterInactivityMs: 5000,
    },
    ping: {
      enabled: true,
      intervalMs: 2500,
    },
  },
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;
export const middleware = t.middleware;
