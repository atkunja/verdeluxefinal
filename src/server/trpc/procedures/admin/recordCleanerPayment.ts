import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const recordCleanerPayment = requireAdmin
    .input(
        z.object({
            cleanerId: z.number(),
            amount: z.number().positive(),
            description: z.string().optional(),
            bookingId: z.number().optional(),
            date: z.string().optional(), // ISO date string
        })
    )
    .mutation(async ({ input }) => {
        const payment = await db.payment.create({
            data: {
                cleanerId: input.cleanerId,
                amount: input.amount,
                description: input.description || "Cleaner Payment",
                bookingId: input.bookingId, // Optional now
                createdAt: input.date ? new Date(input.date) : new Date(),
                paidAt: new Date(),
            },
        });

        return payment;
    });
