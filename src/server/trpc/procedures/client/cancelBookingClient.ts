import { z } from "zod";
import { db } from "~/server/db";
import { requireAuth } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";
import { TRPCError } from "@trpc/server";

export const cancelBookingClient = requireAuth
    .input(
        z.object({
            bookingId: z.number(),
        })
    )
    .mutation(async ({ ctx, input }) => {
        const userId = ctx.profile.id;

        const booking = await db.booking.findUnique({
            where: { id: input.bookingId },
            include: {
                client: true,
            },
        });

        if (!booking) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Booking not found",
            });
        }

        if (booking.clientId !== userId) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You can only cancel your own bookings",
            });
        }

        if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Cannot cancel a booking that is already ${booking.status.toLowerCase()}`,
            });
        }

        // Handle Stripe Holds / Refunds
        // Logic similar to updateBookingAdmin.ts but simplified for client access
        const holdToCancel = await db.stripePayment.findFirst({
            where: {
                bookingId: input.bookingId,
                status: { in: ["requires_capture", "requires_confirmation"] },
            },
            orderBy: { createdAt: "desc" },
        });

        if (holdToCancel?.stripeIntentId) {
            try {
                await stripe.paymentIntents.cancel(holdToCancel.stripeIntentId);
                await db.stripePayment.update({
                    where: { id: holdToCancel.id },
                    data: { status: "canceled" },
                });
            } catch (err) {
                console.error("Failed to cancel Stripe hold during client cancellation", err);
            }
        }

        const updatedBooking = await db.booking.update({
            where: { id: input.bookingId },
            data: {
                status: "CANCELLED",
            },
        });

        // Log the action
        await db.systemLog.create({
            data: {
                userId: userId,
                action: "booking.client_cancelled",
                entity: "booking",
                entityId: input.bookingId,
                metadata: {
                    reason: "Cancelled by client via portal"
                } as any,
            } as any,
        });

        return { success: true, booking: updatedBooking };
    });
