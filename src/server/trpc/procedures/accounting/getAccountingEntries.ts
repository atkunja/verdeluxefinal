import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getAccountingEntries = baseProcedure.query(async () => {
  const entries = await db.accountingEntry.findMany();
  return entries;
});
