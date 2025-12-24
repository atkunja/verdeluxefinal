import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const getLatestBookingForClient = requireAdmin
  .input(
    z.object({
      clientId: z.number(),
    })
  )
  .query(async ({ input }) => {
    const booking = await db.booking.findFirst({
      where: { clientId: input.clientId },
      orderBy: { scheduledDate: "desc" },
      select: {
        id: true,
        address: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        placeId: true,
        latitude: true,
        longitude: true,
        paymentMethod: true,
      },
    });

    return { booking };
  });
