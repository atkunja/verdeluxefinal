import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getBookingPayments = requireAdmin
  .input(z.object({ bookingId: z.number() }))
  .query(async ({ input }) => {
    const payments = await db.stripePayment.findMany({
      where: { bookingId: input.bookingId },
      orderBy: { createdAt: "desc" },
    });
    return { payments };
  });
