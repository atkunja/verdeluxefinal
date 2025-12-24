import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";
import { db } from "~/server/db";

export const attachPaymentMethodFromSetupIntent = requireAdmin
  .input(
    z.object({
      setupIntentId: z.string(),
      userId: z.number(),
      setDefault: z.boolean().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await db.user.findUnique({ where: { id: input.userId } });
    if (!user?.stripeCustomerId) {
      throw new Error("User missing stripe customer");
    }
    const si = await stripe.setupIntents.retrieve(input.setupIntentId);
    if (!si.payment_method) {
      throw new Error("No payment method on setup intent");
    }
    const pmId = typeof si.payment_method === "string" ? si.payment_method : si.payment_method.id;
    await stripe.paymentMethods.attach(pmId, { customer: user.stripeCustomerId });
    if (input.setDefault) {
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: { default_payment_method: pmId },
      });
      await db.user.update({
        where: { id: input.userId },
        data: { stripeDefaultPaymentMethodId: pmId },
      });
    }
    return { paymentMethodId: pmId };
  });
