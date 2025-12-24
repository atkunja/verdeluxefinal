import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";
import { db } from "~/server/db";

export const createPaymentIntent = baseProcedure
  .input(
    z.object({
      amount: z.number().positive(),
      currency: z.string().default("usd"),
      bookingId: z.number().optional(),
      description: z.string().optional(),
      paymentMethodTypes: z.array(z.string()).optional(),
      customerId: z.string().optional(),
      paymentMethodId: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      description: input.description,
      metadata: input.bookingId ? { bookingId: input.bookingId.toString() } : undefined,
      payment_method_types: input.paymentMethodTypes ?? ["card"],
      capture_method: "automatic",
      customer: input.customerId,
      payment_method: input.paymentMethodId,
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

    return { clientSecret: intent.client_secret, intentId: intent.id, status: intent.status };
  });
