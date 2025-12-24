import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getBillingConfig = requireAdmin.query(async () => {
  const config = await db.billingConfig.findFirst({
    orderBy: { id: "asc" },
  });
  return config || { id: 1, holdDelayHours: null };
});
