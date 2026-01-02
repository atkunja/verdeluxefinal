import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";
import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";

export const addBookingTip = requireAdmin
    .input(
        z.object({
            bookingId: z.number(),
            tipAmount: z.number().positive(),
        })
    )
    .mutation(async ({ input }) => {
        const booking = await db.booking.findUnique({
            where: { id: input.bookingId },
            include: { client: true },
        });

        if (!booking) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Booking not found",
            });
        }

        // 1. Update Booking tipAmount
        const updatedBooking = await db.booking.update({
            where: { id: input.bookingId },
            data: {
                tipAmount: (booking.tipAmount || 0) + input.tipAmount,
            },
        });

        // 2. Attempt to charge the tip via Stripe if customer exists
        if (booking.client.stripeCustomerId && booking.client.stripeDefaultPaymentMethodId && stripe) {
            try {
                const intent = await stripe.paymentIntents.create({
                    amount: Math.round(input.tipAmount * 100),
                    currency: "usd",
                    customer: booking.client.stripeCustomerId,
                    payment_method: booking.client.stripeDefaultPaymentMethodId,
                    off_session: true,
                    confirm: true,
                    description: `Tip for booking #${booking.id}`,
                    metadata: { bookingId: booking.id.toString(), type: "tip" },
                });

                // Record the payment
                await db.stripePayment.create({
                    data: {
                        bookingId: booking.id,
                        stripeIntentId: intent.id,
                        amount: input.tipAmount,
                        status: intent.status,
                        currency: "usd",
                        description: `Tip payment: ${intent.status}`,
                    },
                });

                // Create Accounting Entry for the tip income
                await db.accountingEntry.create({
                    data: {
                        date: new Date(),
                        description: `Tip Income - Booking #${booking.id}`,
                        amount: input.tipAmount,
                        category: "INCOME",
                        relatedBookingId: booking.id,
                    },
                });

            } catch (err: any) {
                console.error("Failed to charge tip:", err);
                // We still updated the tipAmount for manual tracking, but we should inform the admin
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Tip added to record, but Stripe charge failed: ${err.message}`,
                });
            }
        } else {
            // If no card on file, we just update the record and maybe create a manual entry
            await db.accountingEntry.create({
                data: {
                    date: new Date(),
                    description: `Tip Recorded (Manual) - Booking #${booking.id}`,
                    amount: input.tipAmount,
                    category: "INCOME",
                    relatedBookingId: booking.id,
                },
            });
        }

        return { success: true, tipAmount: (updatedBooking as any).tipAmount };
    });
