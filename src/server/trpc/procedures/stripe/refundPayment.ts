import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";
import { db } from "~/server/db";

export const refundPayment = baseProcedure
  .input(
    z.object({
      paymentIntentId: z.string(),
      amount: z.number().positive().optional(),
      reason: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const refund = await stripe.refunds.create({
      payment_intent: input.paymentIntentId,
      amount: input.amount ? Math.round(input.amount * 100) : undefined,
      reason: input.reason as any,
    });

    if (refund.status === "succeeded") {
      await db.stripePayment.updateMany({
        where: { stripeIntentId: input.paymentIntentId },
        data: { status: "refunded" },
      });
    }

    return { refundId: refund.id, status: refund.status };
  });
