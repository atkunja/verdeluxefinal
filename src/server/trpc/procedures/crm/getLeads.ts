import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getLeads = baseProcedure.query(async () => {
  const leads = await db.lead.findMany();
  return leads;
});
