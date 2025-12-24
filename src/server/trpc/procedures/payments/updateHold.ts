import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";
import { db } from "~/server/db";

export const updateHold = requireAdmin
  .input(
    z.object({
      paymentIntentId: z.string(),
      amount: z.number().positive(),
      description: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const existing = await stripe.paymentIntents.retrieve(input.paymentIntentId);
    if (existing.capture_method !== "manual") {
      throw new Error("Not a manual capture hold");
    }

    const updated = await stripe.paymentIntents.update(input.paymentIntentId, {
      amount: Math.round(input.amount * 100),
      description: input.description ?? existing.description ?? undefined,
    });

    await db.stripePayment.updateMany({
      where: { stripeIntentId: input.paymentIntentId },
      data: {
        amount: input.amount,
        status: updated.status,
        currency: updated.currency,
        description: updated.description ?? undefined,
      },
    });

    return {
      id: updated.id,
      amount: updated.amount / 100,
      status: updated.status,
      description: updated.description,
    };
  });
