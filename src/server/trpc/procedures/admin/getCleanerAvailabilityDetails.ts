import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const getCleanerAvailabilityDetails = requireAdmin
  .input(
    z.object({
      cleanerId: z.number(),
      // Optional ISO date strings limiting the window
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const cleaner = await db.user.findUnique({
      where: { id: input.cleanerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    if (!cleaner) {
      throw new Error("Cleaner not found");
    }

    const where: any = { cleanerId: input.cleanerId };
    if (input.startDate || input.endDate) {
      where.scheduledDate = {};
      if (input.startDate) where.scheduledDate.gte = new Date(input.startDate);
      if (input.endDate) {
        const end = new Date(input.endDate);
        end.setHours(23, 59, 59, 999);
        where.scheduledDate.lte = end;
      }
    }

    const bookings = await db.booking.findMany({
      where,
      select: {
        id: true,
        scheduledDate: true,
        scheduledTime: true,
        durationHours: true,
        serviceType: true,
        status: true,
      },
      orderBy: { scheduledDate: "asc" },
    });

    const timeOff = await db.timeOffRequest.findMany({
      where: { cleanerId: input.cleanerId },
      orderBy: { startDate: "asc" },
    });

    return { cleaner, bookings, timeOff };
  });
