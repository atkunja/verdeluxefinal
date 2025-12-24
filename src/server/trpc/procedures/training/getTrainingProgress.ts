import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getTrainingProgress = baseProcedure
  .input(z.object({ cleanerId: z.number() }))
  .query(async ({ input }) => {
    const progress = await db.cleanerTrainingProgress.findMany({
      where: { cleanerId: input.cleanerId },
    });
    return progress;
  });
