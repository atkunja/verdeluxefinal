import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getDiscountConfig = baseProcedure.query(async () => {
  const existing = await db.discountConfig.findUnique({ where: { id: 1 } });
  if (existing) {
    return existing;
  }
  return db.discountConfig.create({
    data: {
      id: 1,
      active: false,
      type: "PERCENT",
      value: 0,
      label: "Get Discount",
    },
  });
});
