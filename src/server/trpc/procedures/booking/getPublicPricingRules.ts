import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getPublicPricingRules = baseProcedure.query(async () => {
  const rules = await db.pricingRule.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      ruleType: true,
      serviceType: true,
      priceAmount: true,
      ratePerUnit: true,
      timeAmount: true,
      timePerUnit: true,
      extraName: true,
      extraDescription: true,
      priceRangeMin: true,
      priceRangeMax: true,
    },
  });

  return { rules };
});
