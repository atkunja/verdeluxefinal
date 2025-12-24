import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const getBookingChecklist = requireAdmin
  .input(
    z.object({
      bookingId: z.number(),
    })
  )
  .query(async ({ input }) => {
    const checklist = await db.bookingChecklist.findUnique({
      where: { bookingId: input.bookingId },
      include: {
        template: true,
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!checklist) {
      throw new Error("Checklist not found for this booking");
    }

    return { checklist };
  });
