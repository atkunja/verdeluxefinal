import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";

export const getBookingAdmin = requireAdmin
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ input }: { input: { bookingId: number } }) => {
        const booking = await db.booking.findUnique({
            where: { id: input.bookingId },
            include: {
                client: true,
                cleaners: {
                    include: {
                        cleaner: true,
                    },
                },
                stripePayments: true,
            },
        });

        if (!booking) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        }

        // Transform to match AdminBookingForm expectations
        return {
            booking: {
                ...booking,
                scheduledDate: booking.scheduledDate.toISOString(),
                cleanerIds: booking.cleaners.map((c) => c.cleanerId),
                selectedExtras: booking.selectedExtras as number[], // Assuming it's stored as JSON array of IDs or similar. Check schema if strictly relation.
            },
        };
    });
