import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const assignCleaners = requireAdmin
    .input(
        z.object({
            bookingId: z.number(),
            cleanerIds: z.array(z.number()),
            status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
        })
    )
    .mutation(async ({ input }) => {
        const { bookingId, cleanerIds, status } = input;

        // 1. Verify booking exists
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking) {
            throw new Error("Booking not found");
        }

        // 2. Verify all cleaners exist and have the CLEANER role
        const cleaners = await db.user.findMany({
            where: {
                id: { in: cleanerIds },
                role: "CLEANER",
            },
            select: { id: true },
        });

        if (cleaners.length !== cleanerIds.length) {
            throw new Error("One or more invalid cleaner IDs provided");
        }

        // 3. Update booking status and primary cleanerId (if needed)
        // We'll set the first cleaner as the primary cleanerId for compatibility
        const primaryCleanerId = cleanerIds[0] || null;

        await db.booking.update({
            where: { id: bookingId },
            data: {
                cleanerId: primaryCleanerId,
                status: status || "CONFIRMED", // Default to CONFIRMED if assigning cleaners
            },
        });

        // 4. Update the BookingCleaner many-to-many relation
        // First, remove existing assignments
        await db.bookingCleaner.deleteMany({
            where: { bookingId },
        });

        // Then, add new assignments
        if (cleanerIds.length > 0) {
            await db.bookingCleaner.createMany({
                data: cleanerIds.map((cid) => ({
                    bookingId,
                    cleanerId: cid,
                })),
                skipDuplicates: true,
            });
        }

        return { success: true };
    });
