import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const updateAccountingEntry = baseProcedure
  .input(
    z.object({
      id: z.number(),
      date: z.date().optional(),
      description: z.string().optional(),
      amount: z.number().optional(),
      category: z.enum(["INCOME", "EXPENSE", "ASSET", "LIABILITY", "EQUITY"]).optional(),
      relatedBookingId: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { id, ...data } = input;
    const entry = await db.accountingEntry.update({
      where: { id },
      data,
    });
    return entry;
  });
