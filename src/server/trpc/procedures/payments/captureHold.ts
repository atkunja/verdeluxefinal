import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";
import { db } from "~/server/db";

export const captureHold = requireAdmin
  .input(
    z.object({
      paymentIntentId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const intent = await stripe.paymentIntents.capture(input.paymentIntentId);
    await db.stripePayment.updateMany({
      where: { stripeIntentId: input.paymentIntentId },
      data: { status: intent.status },
    });
    return intent;
  });
