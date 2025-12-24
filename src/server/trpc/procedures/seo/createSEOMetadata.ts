import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const createSEOMetadata = baseProcedure
  .input(
    z.object({
      path: z.string(),
      title: z.string(),
      description: z.string(),
      keywords: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const metadata = await db.sEOMetadata.create({ data: input });
    return metadata;
  });
