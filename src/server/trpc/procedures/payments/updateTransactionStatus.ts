import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const updateTransactionStatus = requireAdmin
  .input(
    z.object({
      id: z.string(), // expects mercury externalId
      status: z.enum(["posted", "pending", "excluded"]),
    })
  )
  .mutation(async ({ input }) => {
    const result = await db.mercuryTransaction.updateMany({
      where: { externalId: input.id },
      data: { status: input.status },
    });
    return { updated: result.count };
  });
