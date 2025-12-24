import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const updatePricingRule = requireAdmin
  .input(
    z.object({
      ruleId: z.number(),
      name: z.string().min(1, "Name is required").optional(),
      ruleType: z.enum(["BASE_PRICE", "SQFT_RATE", "BEDROOM_RATE", "BATHROOM_RATE", "EXTRA_SERVICE", "TIME_ESTIMATE"]).optional(),
      serviceType: z.string().nullable().optional(),
      priceAmount: z.number().positive().nullable().optional(),
      ratePerUnit: z.number().positive().nullable().optional(),
      timeAmount: z.number().positive().nullable().optional(),
      timePerUnit: z.number().positive().nullable().optional(),
      extraName: z.string().nullable().optional(),
      extraDescription: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
      displayOrder: z.number().int().optional(),
      priceRangeMin: z.number().positive().nullable().optional(),
      priceRangeMax: z.number().positive().nullable().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const existingRule = await db.pricingRule.findUnique({
      where: { id: input.ruleId },
    });

    if (!existingRule) {
      throw new Error("Pricing rule not found");
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.ruleType !== undefined) updateData.ruleType = input.ruleType;
    if (input.serviceType !== undefined) updateData.serviceType = input.serviceType;
    if (input.priceAmount !== undefined) updateData.priceAmount = input.priceAmount;
    if (input.ratePerUnit !== undefined) updateData.ratePerUnit = input.ratePerUnit;
    if (input.timeAmount !== undefined) updateData.timeAmount = input.timeAmount;
    if (input.timePerUnit !== undefined) updateData.timePerUnit = input.timePerUnit;
    if (input.extraName !== undefined) updateData.extraName = input.extraName;
    if (input.extraDescription !== undefined) updateData.extraDescription = input.extraDescription;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
    if (input.priceRangeMin !== undefined) updateData.priceRangeMin = input.priceRangeMin;
    if (input.priceRangeMax !== undefined) updateData.priceRangeMax = input.priceRangeMax;

    const pricingRule = await db.pricingRule.update({
      where: { id: input.ruleId },
      data: updateData,
    });

    return { pricingRule };
  });
