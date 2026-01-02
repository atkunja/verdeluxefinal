import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getBookingTimeLogs = requireAdmin
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ input }) => {
        return await db.timeEntry.findMany({
            where: { bookingId: input.bookingId },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { startTime: "desc" },
        });
    });
