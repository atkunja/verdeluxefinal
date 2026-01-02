import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const getCurrentUser = baseProcedure
  .input(
    z.object({
      authToken: z.string().optional(),
    })
  )
  .query(async ({ ctx }) => {
    // The auth logic is now handled in the gateway (handler.ts) which populates ctx.profile
    // We strictly rely on the server-side validation to avoid JWT secret mismatches.
    if (!ctx.profile) {
      console.log("[getCurrentUser] No profile found in context, throwing UNAUTHORIZED");
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired session",
      });
    }

    console.log(`[getCurrentUser] Success for user: ${ctx.profile.email}, role: ${ctx.profile.role}`);

    return {
      id: ctx.profile.id,
      email: ctx.profile.email,
      role: ctx.profile.role as any,
      firstName: ctx.profile.firstName,
      lastName: ctx.profile.lastName,
      // Note: context profile might not have phone, but it's okay for now or we can extend it
      adminPermissions: (ctx.profile.role === "ADMIN" || ctx.profile.role === "OWNER")
        ? ctx.profile.adminPermissions as Record<string, boolean> | null
        : null,
    };
  });
