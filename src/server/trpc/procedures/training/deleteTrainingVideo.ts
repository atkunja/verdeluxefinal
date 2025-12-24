import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const deleteTrainingVideo = baseProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    await db.trainingVideo.delete({ where: { id: input.id } });
    return { success: true };
  });
