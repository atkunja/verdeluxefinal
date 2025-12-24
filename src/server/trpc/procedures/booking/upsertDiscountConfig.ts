import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const upsertDiscountConfig = requireAdmin
  .input(
    z.object({
      active: z.boolean(),
      type: z.enum(["PERCENT", "FIXED_AMOUNT"]),
      value: z.number().nonnegative(),
      label: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    return db.discountConfig.upsert({
      where: { id: 1 },
      create: { id: 1, ...input },
      update: { ...input },
    });
  });
