import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { requireAuth } from "~/server/trpc/main";

export const getAllBookings = requireAuth
  .query(async ({ ctx }) => {
    // Verify role (ctx.profile is guaranteed by requireAuth)
    if (ctx.profile.role !== "CLIENT") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access their bookings",
      });
    }

    // Fetch all bookings for this client
    const bookings = await db.booking.findMany({
      where: {
        clientId: ctx.profile.id,
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
        scheduledDate: "desc",
      },
    });

    // Derive status: any booking with a past scheduled date should be treated as completed (unless cancelled)
    const now = new Date();
    const bookingsWithDerivedStatus = bookings.map((booking) => {
      const scheduledDate = new Date(booking.scheduledDate);

      if (scheduledDate < now && booking.status !== "CANCELLED") {
        return {
          ...booking,
          status: "COMPLETED" as const,
        };
      }

      return booking;
    });

    return { bookings: bookingsWithDerivedStatus };
  });
