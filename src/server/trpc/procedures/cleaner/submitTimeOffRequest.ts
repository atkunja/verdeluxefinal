import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const submitTimeOffRequest = baseProcedure
  .input(
    z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
      reason: z.string().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.profile?.id;
    if (!userId || ctx.profile?.role !== "CLEANER") {
      throw new Error("Only cleaners can submit time-off requests");
    }

    // Validate dates
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (endDate < startDate) {
      throw new Error("End date must be after start date");
    }

    // Create the time-off request
    const timeOffRequest = await db.timeOffRequest.create({
      data: {
        cleanerId: userId,
        startDate,
        endDate,
        reason: input.reason,
        status: "PENDING",
      },
    });

    return {
      success: true,
      request: timeOffRequest,
    };
  });
