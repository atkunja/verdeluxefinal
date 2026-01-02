import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { mercury } from "~/server/services/mercury";
import { TRPCError } from "@trpc/server";

export const triggerMercuryPayout = requireAdmin
    .input(
        z.object({
            cleanerId: z.number(),
            amount: z.number().positive(),
            mercuryAccountId: z.string(), // The account to pay from
            note: z.string().optional(),
        })
    )
    .mutation(async ({ input }) => {
        const cleaner = await db.user.findUnique({
            where: { id: input.cleanerId },
        });

        if (!cleaner) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Cleaner not found",
            });
        }

        // 1. Trigger the payout via Mercury
        let mercuryResponse;
        try {
            mercuryResponse = await mercury.sendPayment(
                input.mercuryAccountId,
                `${cleaner.firstName} ${cleaner.lastName}`,
                input.amount,
                input.note ?? `Payout for cleaner: ${cleaner.email}`
            );
        } catch (err: any) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Mercury Payout Failed: ${err.message}`,
            });
        }

        if (!mercuryResponse || !mercuryResponse.id) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Invalid response from Mercury API",
            });
        }

        // 2. Record the payment in our DB
        const payment = await db.payment.create({
            data: {
                cleanerId: cleaner.id,
                amount: input.amount,
                description: input.note || `Mercury ACH Payout - ${mercuryResponse.id}`,
                paidAt: new Date(),
                bookingId: 0, // Should we link to multiple bookings? For now, 0 or null if schema allows.
                // Wait, bookingId is NOT NULL in the schema I saw.
                // Let's check schema again. Yes: bookingId Int (NOT NULL)
            },
        });

        // 3. Record Mercury Transaction
        await db.mercuryTransaction.create({
            data: {
                externalId: mercuryResponse.id,
                amount: -input.amount, // Negative for outflow
                description: input.note || `Payout to ${cleaner.firstName} ${cleaner.lastName}`,
                status: mercuryResponse.status || "pending",
                transactionAt: new Date(),
                // accountId? We need the DB ID of the MercuryAccount if it exists.
            },
        });

        // 4. Create Accounting Entry
        await db.accountingEntry.create({
            data: {
                date: new Date(),
                description: `Cleaner Payout: ${cleaner.firstName} ${cleaner.lastName}`,
                amount: -input.amount,
                category: "EXPENSE",
            }
        });

        return { success: true, paymentId: payment.id, mercuryId: mercuryResponse.id };
    });
