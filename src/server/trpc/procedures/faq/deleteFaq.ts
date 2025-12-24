import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const deleteFaq = baseProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    await db.fAQ.delete({ where: { id: input.id } });
    return { success: true };
  });
