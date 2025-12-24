import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { requireAuth } from "~/server/trpc/main";

export const generateToken = requireAuth
  .input(z.void())
  .query(async ({ ctx }) => {
    const userId = ctx.profile?.id;
    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      token: null,
      identity: `user_${user.id}`,
      note: "Voice calling is disabled while migrating to OpenPhone.",
    };
  });
