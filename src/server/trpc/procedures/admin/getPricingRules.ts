import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const getPricingRules = requireAdmin.query(async () => {
  const pricingRules = await db.pricingRule.findMany({
    orderBy: [
      { displayOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  return { pricingRules };
});
