import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const getBookingAvailability = requireAdmin
  .input(
    z.object({
      // Required ISO date strings defining the availability window
      startDate: z.string(),
      endDate: z.string(),
    })
  )
  .query(async ({ input }) => {
    const endDateInclusive = new Date(input.endDate);
    endDateInclusive.setHours(23, 59, 59, 999);

    const bookings = await db.booking.findMany({
      where: {
        scheduledDate: {
          gte: new Date(input.startDate),
          lte: endDateInclusive,
        },
        status: {
          not: "CANCELLED",
        },
      },
      select: {
        id: true,
        scheduledDate: true,
        scheduledTime: true,
        durationHours: true,
        serviceType: true,
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        scheduledTime: "asc",
      },
    });

    return { bookings };
  });
