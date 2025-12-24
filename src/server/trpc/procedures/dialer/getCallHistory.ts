import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { requireAuth } from "~/server/trpc/main";

export const getCallHistory = requireAuth
  .input(
    z.object({
      limit: z.number().optional().default(50),
    }),
  )
  .query(async ({ input, ctx }) => {
    const userId = ctx.profile?.id;
    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
    }

    // Fetch call history
    const callLogs = await db.callLog.findMany({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        contact: { select: { firstName: true, lastName: true, email: true } },
      } as any,
      orderBy: { createdAt: "desc" },
      take: input.limit,
    });

    return {
      callLogs,
    };
  });
