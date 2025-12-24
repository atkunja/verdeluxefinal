import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";
import { db } from "~/server/db";

export const createHold = requireAdmin
  .input(
    z.object({
      bookingId: z.number().optional(),
      amount: z.number().positive(),
      currency: z.string().default("usd"),
      description: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      capture_method: "manual",
      description: input.description,
      metadata: input.bookingId ? { bookingId: input.bookingId.toString() } : undefined,
    });

    await db.stripePayment.upsert({
      where: { stripeIntentId: intent.id },
      update: {
        amount: input.amount,
        status: intent.status,
        currency: input.currency,
        bookingId: input.bookingId ?? null,
        description: input.description ?? null,
      },
      create: {
        stripeIntentId: intent.id,
        amount: input.amount,
        status: intent.status,
        currency: input.currency,
        bookingId: input.bookingId ?? null,
        description: input.description ?? null,
      },
    });

    return intent;
  });
