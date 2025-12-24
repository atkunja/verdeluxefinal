import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const createTrainingVideo = baseProcedure
  .input(
    z.object({
      title: z.string(),
      description: z.string(),
      videoUrl: z.string(),
      duration: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const video = await db.trainingVideo.create({ data: input });
    return video;
  });
