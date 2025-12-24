import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const updateTrainingVideo = baseProcedure
  .input(
    z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      videoUrl: z.string().optional(),
      duration: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { id, ...data } = input;
    const video = await db.trainingVideo.update({
      where: { id },
      data,
    });
    return video;
  });
