import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const updateQuizSubmission = baseProcedure
  .input(
    z.object({
      submissionId: z.number(),
      data: z
        .object({
          cleanType: z.string().optional(),
          bedrooms: z.number().int().optional(),
          bathrooms: z.number().int().optional(),
          messiness: z.number().int().min(1).max(5).optional(),
          kids: z.boolean().optional(),
          pets: z.boolean().optional(),
          addressLine1: z.string().optional(),
          addressLine2: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          postalCode: z.string().optional(),
          country: z.string().optional(),
          placeId: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          extras: z.any().optional(),
          recommendedCleanType: z.string().optional(),
          recommendedDurationHours: z.number().optional(),
          originalTotalCents: z.number().int().optional(),
          discountCents: z.number().int().optional(),
          finalTotalCents: z.number().int().optional(),
          appointmentDateTime: z.string().optional(),
          willBeHome: z.boolean().optional(),
          homeType: z.string().optional(),
          parkingNotes: z.string().optional(),
          entryInstructions: z.string().optional(),
          cleaningInstructions: z.string().optional(),
          termsAccepted: z.boolean().optional(),
          status: z.string().optional(),
        })
        .partial(),
    })
  )
  .mutation(async ({ input }) => {
    const data: Record<string, unknown> = { ...input.data };
    if (input.data.appointmentDateTime) {
      data.appointmentDateTime = new Date(input.data.appointmentDateTime);
    }

    return db.cleanQuizSubmission.update({
      where: { id: input.submissionId },
      data,
    });
  });
