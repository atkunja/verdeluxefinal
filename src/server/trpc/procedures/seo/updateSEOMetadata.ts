import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const updateSEOMetadata = baseProcedure
  .input(
    z.object({
      id: z.number(),
      path: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { id, ...data } = input;
    const metadata = await db.sEOMetadata.update({
      where: { id },
      data,
    });
    return metadata;
  });
