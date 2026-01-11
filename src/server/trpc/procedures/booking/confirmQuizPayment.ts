import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/client";

export const confirmQuizPayment = baseProcedure
  .input(z.object({ submissionId: z.number() }))
  .mutation(async ({ input }) => {
    const submission = await db.cleanQuizSubmission.findUnique({
      where: { id: input.submissionId },
    });

    if (!submission) {
      throw new Error("Quiz submission not found.");
    }

    if (!submission.finalTotalCents || !submission.stripePaymentMethodId) {
      throw new Error("Missing pricing or payment method.");
    }

    const intent = await stripe.paymentIntents.create({
      amount: submission.finalTotalCents,
      currency: "usd",
      customer: submission.stripeCustomerId ?? undefined,
      payment_method: submission.stripePaymentMethodId,
      confirm: true,
      description: `LuxeClean booking quiz #${submission.id}`,
      metadata: { submissionId: submission.id.toString() },
    });

    await db.cleanQuizSubmission.update({
      where: { id: submission.id },
      data: {
        stripePaymentIntentId: intent.id,
        status: intent.status === "succeeded" ? "confirmed" : "payment_pending",
      },
    });

    return { status: intent.status };
  });
