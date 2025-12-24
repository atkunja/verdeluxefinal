import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/client";

export const getCustomerPaymentMethods = requireAdmin
  .input(z.object({ customerId: z.number() }))
  .query(async ({ input }) => {
    const user = await db.user.findUnique({ where: { id: input.customerId } });
    if (!user) {
      throw new Error("Customer not found");
    }
    if (!user.stripeCustomerId) {
      return { paymentMethods: [] };
    }

    const methods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
    });

    return {
      paymentMethods: methods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year,
        isDefault: user.stripeDefaultPaymentMethodId === pm.id,
      })),
    };
  });

