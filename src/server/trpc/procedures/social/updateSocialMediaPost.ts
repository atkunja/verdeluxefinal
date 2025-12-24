import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const updateSocialMediaPost = baseProcedure
  .input(
    z.object({
      id: z.number(),
      platform: z.string().optional(),
      content: z.string().optional(),
      scheduledAt: z.date().optional(),
      status: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { id, ...data } = input;
    const post = await db.socialMediaPost.update({
      where: { id },
      data,
    });
    return post;
  });
