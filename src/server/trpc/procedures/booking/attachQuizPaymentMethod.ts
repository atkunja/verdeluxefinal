import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/client";

export const attachQuizPaymentMethod = baseProcedure
  .input(
    z.object({
      submissionId: z.number(),
      setupIntentId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const submission = await db.cleanQuizSubmission.findUnique({
      where: { id: input.submissionId },
    });

    if (!submission) {
      throw new Error("Quiz submission not found.");
    }

    const setupIntent = await stripe.setupIntents.retrieve(input.setupIntentId);
    const paymentMethodId = typeof setupIntent.payment_method === "string" ? setupIntent.payment_method : null;

    if (!paymentMethodId) {
      throw new Error("No payment method attached.");
    }

    if (submission.stripeCustomerId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: submission.stripeCustomerId,
      });
      await stripe.customers.update(submission.stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    await db.cleanQuizSubmission.update({
      where: { id: submission.id },
      data: {
        stripeSetupIntentId: input.setupIntentId,
        stripePaymentMethodId: paymentMethodId,
      },
    });

    return { paymentMethodId };
  });
