import {
  createCallerFactory,
  createTRPCRouter,
  baseProcedure,
} from "./trpc";

// Re-export core TRPC helpers so other modules can import from this "main" entrypoint.
export { createCallerFactory, createTRPCRouter, baseProcedure };

import { TRPCError } from "@trpc/server";

export const requireAuth = baseProcedure.use(({ ctx, next }) => {
  if (!ctx.authUser || !ctx.profile) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: `Auth failed: authUser=${!!ctx.authUser}, profile=${!!ctx.profile}`,
    });
  }
  return next({
    ctx: {
      authUser: ctx.authUser,
      profile: ctx.profile,
      token: ctx.token,
    },
  });
});

export const requireAdmin = requireAuth.use(({ ctx, next }) => {
  const role = ctx.profile?.role;
  if (role !== "ADMIN" && role !== "OWNER") {
    throw new Error("FORBIDDEN");
  }
  return next();
});

import { auditLogMiddleware } from "./middleware/auditLog";

export const auditedProcedure = baseProcedure.use(auditLogMiddleware);
