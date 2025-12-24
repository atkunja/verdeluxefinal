import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getTimeEntries = baseProcedure
  .input(z.object({ userId: z.number().optional(), bookingId: z.number().optional() }))
  .query(async ({ input }) => {
    const where: any = {};
    if (input.userId) where.userId = input.userId;
    if (input.bookingId) where.bookingId = input.bookingId;

    const timeEntries = await db.timeEntry.findMany({
      where,
      orderBy: {
        startTime: "desc",
      },
    });

    return timeEntries;
  });
