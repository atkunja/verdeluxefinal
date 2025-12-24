import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/client";

export const createQuizSetupIntent = baseProcedure
  .input(
    z.object({
      submissionId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const submission = await db.cleanQuizSubmission.findUnique({
      where: { id: input.submissionId },
    });

    if (!submission) {
      throw new Error("Quiz submission not found.");
    }

    let customerId = submission.stripeCustomerId || undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: submission.email,
        name: submission.fullName,
        phone: submission.phone,
      });
      customerId = customer.id;
    }

    const intent = await stripe.setupIntents.create({
      usage: "off_session",
      customer: customerId,
      metadata: { submissionId: submission.id.toString() },
    });

    await db.cleanQuizSubmission.update({
      where: { id: submission.id },
      data: {
        stripeCustomerId: customerId,
        stripeSetupIntentId: intent.id,
      },
    });

    return {
      clientSecret: intent.client_secret,
      setupIntentId: intent.id,
      customerId,
    };
  });
