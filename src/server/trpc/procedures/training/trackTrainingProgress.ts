import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const trackTrainingProgress = baseProcedure
  .input(
    z.object({
      cleanerId: z.number(),
      videoId: z.number(),
      score: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const progress = await db.cleanerTrainingProgress.create({
      data: { ...input, completedAt: new Date() },
    });
    return progress;
  });
