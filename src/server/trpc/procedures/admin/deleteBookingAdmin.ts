import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const deleteBookingAdmin = requireAdmin
  .input(
    z.object({
      bookingId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const booking = await db.booking.findUnique({
      where: { id: input.bookingId },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    await db.booking.delete({
      where: { id: input.bookingId },
    });

    return { success: true };
  });
