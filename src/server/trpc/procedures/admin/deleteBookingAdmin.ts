import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";
import { logAction } from "~/server/services/logger";

export const deleteBookingAdmin = requireAdmin
  .input(
    z.object({
      bookingId: z.number(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const booking = await db.booking.findUnique({
      where: { id: input.bookingId },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // 1. Audit log before deletion
    await logAction({
      userId: ctx.profile.id,
      action: "booking.deleted",
      entity: "Booking",
      entityId: input.bookingId,
      before: booking,
    });

    await db.booking.delete({
      where: { id: input.bookingId },
    });

    return { success: true };
  });
