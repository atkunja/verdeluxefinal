import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const deleteAccountingEntry = baseProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    await db.accountingEntry.delete({ where: { id: input.id } });
    return { success: true };
  });
