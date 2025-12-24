import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";

export const requestOffPlatformPayment = baseProcedure
  .input(
    z.object({
      bookingId: z.number(),
      amount: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    // This is a placeholder. A real implementation would send an email to the customer with a payment link.
    console.log(`Requesting off-platform payment for booking ${input.bookingId} of amount ${input.amount}`);
    return { success: true };
  });
