import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getPaymentStatus = requireAdmin
  .input(z.object({ bookingId: z.number() }))
  .query(async ({ input }) => {
    const payments = await db.stripePayment.findMany({
      where: { bookingId: input.bookingId },
      orderBy: { createdAt: "desc" },
    });

    const latest = payments[0];
    const status = latest?.status ?? "unknown";
    const held = payments.find((p) => p.status === "requires_capture" || p.status === "requires_confirmation");
    const captured = payments.find((p) => p.status === "succeeded" || p.status === "processing");
    const refunded = payments.find((p) => p.status === "refunded");

    return {
      status,
      heldAmount: held?.amount ?? 0,
      capturedAmount: captured?.amount ?? 0,
      refundedAmount: refunded?.amount ?? 0,
      currency: latest?.currency ?? "usd",
      paymentMethodLabel: latest?.description ?? "Card on file",
      raw: payments,
    };
  });
