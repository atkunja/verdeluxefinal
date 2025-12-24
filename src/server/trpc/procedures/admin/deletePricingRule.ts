import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const deletePricingRule = requireAdmin
  .input(
    z.object({
      ruleId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const existingRule = await db.pricingRule.findUnique({
      where: { id: input.ruleId },
    });

    if (!existingRule) {
      throw new Error("Pricing rule not found");
    }

    await db.pricingRule.delete({ where: { id: input.ruleId } });
    return { success: true };
  });
