import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";
import { db } from "~/server/db";

export const createSetupIntent = baseProcedure
  .input(
    z.object({
      bookingId: z.number().optional(),
      customerEmail: z.string().email().optional(),
      userId: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    let customerId: string | undefined;
    if (input.userId) {
      const user = await db.user.findUnique({ where: { id: input.userId } });
      if (user?.stripeCustomerId) {
        customerId = user.stripeCustomerId;
      } else if (user?.email) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        });
        customerId = customer.id;
        await db.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customer.id },
        });
      }
    }

    const intent = await stripe.setupIntents.create({
      usage: "off_session",
      customer: customerId,
      metadata: input.bookingId ? { bookingId: input.bookingId.toString() } : undefined,
    });
    return { clientSecret: intent.client_secret, setupIntentId: intent.id };
  });
