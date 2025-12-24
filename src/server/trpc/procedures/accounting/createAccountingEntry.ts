import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const createAccountingEntry = baseProcedure
  .input(
    z.object({
      date: z.date(),
      description: z.string(),
      amount: z.number(),
      category: z.enum(["INCOME", "EXPENSE", "ASSET", "LIABILITY", "EQUITY"]),
      relatedBookingId: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const entry = await db.accountingEntry.create({ data: input });
    return entry;
  });
