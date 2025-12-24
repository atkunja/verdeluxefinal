import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const deleteTimeOffRequest = baseProcedure
  .input(
    z.object({
      requestId: z.number(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.profile?.id;
    if (!userId || ctx.profile?.role !== "CLEANER") {
      throw new Error("Only cleaners can delete time-off requests");
    }

    // Get the time-off request and verify ownership
    const request = await db.timeOffRequest.findUnique({
      where: { id: input.requestId },
    });

    if (!request) {
      throw new Error("Time-off request not found");
    }

    if (request.cleanerId !== userId) {
      throw new Error("You can only delete your own time-off requests");
    }

    if (request.status !== "PENDING") {
      throw new Error("Only pending requests can be deleted");
    }

    // Delete the request
    await db.timeOffRequest.delete({
      where: { id: input.requestId },
    });

    return {
      success: true,
    };
  });
