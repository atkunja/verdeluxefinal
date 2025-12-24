import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";
import { db } from "~/server/db";

export const createChargeWithSavedMethod = requireAdmin
  .input(
    z.object({
      userId: z.number(),
      bookingId: z.number(),
      amount: z.number().positive(),
      currency: z.string().default("usd"),
      description: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await db.user.findUnique({ where: { id: input.userId } });
    if (!user?.stripeCustomerId || !user.stripeDefaultPaymentMethodId) {
      throw new Error("User missing saved payment method");
    }
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      customer: user.stripeCustomerId,
      payment_method: user.stripeDefaultPaymentMethodId,
      off_session: true,
      confirm: true,
      description: input.description ?? `Charge for booking #${input.bookingId}`,
      metadata: { bookingId: input.bookingId.toString() },
    });

    const charges = (intent as any).charges;
    const paymentMethod =
      charges?.data?.[0]?.payment_method_details?.card?.last4
        ? `Card • ${charges.data[0].payment_method_details.card.last4}`
        : (intent as any).payment_method ?? undefined;

    await db.stripePayment.create({
      data: {
        bookingId: input.bookingId,
        stripeIntentId: intent.id,
        amount: input.amount,
        status: intent.status,
        currency: intent.currency,
        description: intent.description ?? undefined,
        paymentMethod,
      },
    });

    return { intentId: intent.id, status: intent.status };
  });
