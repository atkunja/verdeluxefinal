import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const updateTransactionCategory = requireAdmin
  .input(
    z.object({
      id: z.string(), // mercury externalId
      category: z.string(),
      subCategory: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const result = await db.mercuryTransaction.updateMany({
      where: { externalId: input.id },
      data: {
        category: input.category,
        description: input.subCategory
          ? { set: input.subCategory }
          : undefined,
      },
    });
    return { updated: result.count };
  });
