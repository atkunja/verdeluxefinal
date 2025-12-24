import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const createPricingRule = requireAdmin
  .input(
    z.object({
      name: z.string().min(1, "Name is required"),
      ruleType: z.enum(["BASE_PRICE", "SQFT_RATE", "BEDROOM_RATE", "BATHROOM_RATE", "EXTRA_SERVICE", "TIME_ESTIMATE"]),
      serviceType: z.string().nullable().optional(),
      priceAmount: z.number().positive().nullable().optional(),
      ratePerUnit: z.number().positive().nullable().optional(),
      timeAmount: z.number().positive().nullable().optional(),
      timePerUnit: z.number().positive().nullable().optional(),
      extraName: z.string().nullable().optional(),
      extraDescription: z.string().nullable().optional(),
      isActive: z.boolean().default(true),
      displayOrder: z.number().int().default(0),
      priceRangeMin: z.number().positive().nullable().optional(),
      priceRangeMax: z.number().positive().nullable().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const pricingRule = await db.pricingRule.create({
      data: {
        name: input.name,
        ruleType: input.ruleType,
        serviceType: input.serviceType || null,
        priceAmount: input.priceAmount || null,
        ratePerUnit: input.ratePerUnit || null,
        timeAmount: input.timeAmount || null,
        timePerUnit: input.timePerUnit || null,
        extraName: input.extraName || null,
        extraDescription: input.extraDescription || null,
        isActive: input.isActive,
        displayOrder: input.displayOrder,
        priceRangeMin: input.priceRangeMin ?? null,
        priceRangeMax: input.priceRangeMax ?? null,
      },
    });

    return { pricingRule };
  });
