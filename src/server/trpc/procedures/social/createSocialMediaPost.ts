import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const createSocialMediaPost = baseProcedure
  .input(
    z.object({
      platform: z.string(),
      content: z.string(),
      scheduledAt: z.date().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const post = await db.socialMediaPost.create({ data: { ...input, status: input.scheduledAt ? "scheduled" : "draft" } });
    return post;
  });
