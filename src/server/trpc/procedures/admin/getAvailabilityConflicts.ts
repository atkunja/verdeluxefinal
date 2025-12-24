import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getAvailabilityConflicts = requireAdmin
  .input(
    z.object({
      scheduledDate: z.string(),
      scheduledTime: z.string(),
      cleanerIds: z.array(z.number()).min(1),
      ignoreBookingId: z.number().optional(),
    })
  )
  .query(async ({ input }) => {
    const date = new Date(input.scheduledDate);
    const conflicts = await db.booking.findMany({
      where: {
        ...(input.ignoreBookingId ? { id: { not: input.ignoreBookingId } } : {}),
        scheduledDate: date,
        scheduledTime: input.scheduledTime,
        OR: [
          { cleanerId: { in: input.cleanerIds } },
          { cleaners: { some: { cleanerId: { in: input.cleanerIds } } } },
        ],
      },
      select: { id: true },
    });

    const timeOff = await db.timeOffRequest.findMany({
      where: {
        cleanerId: { in: input.cleanerIds },
        status: "APPROVED",
        startDate: { lte: date },
        endDate: { gte: date },
      },
      select: { id: true },
    });

    return { bookingConflicts: conflicts, timeOffConflicts: timeOff };
  });
