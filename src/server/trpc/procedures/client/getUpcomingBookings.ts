import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { requireAuth } from "~/server/trpc/main";

export const getUpcomingBookings = requireAuth
  .query(async ({ ctx }) => {
    // Verify role (ctx.profile is guaranteed by requireAuth)
    if (ctx.profile.role !== "CLIENT") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access their bookings",
      });
    }

    // Fetch upcoming bookings for this client (only future dates)
    const now = new Date();
    const bookings = await db.booking.findMany({
      where: {
        clientId: ctx.profile.id,
        scheduledDate: { gte: now },
        status: { notIn: ["CANCELLED", "COMPLETED"] },
      },
      include: {
        cleaner: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        scheduledDate: "asc",
      },
    });

    return { bookings };
  });
