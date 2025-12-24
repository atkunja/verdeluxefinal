import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const startQuizSubmission = baseProcedure
  .input(
    z.object({
      fullName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(6),
    })
  )
  .mutation(async ({ input }) => {
    const submission = await db.cleanQuizSubmission.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        status: "started",
      },
    });

    return { submissionId: submission.id };
  });
