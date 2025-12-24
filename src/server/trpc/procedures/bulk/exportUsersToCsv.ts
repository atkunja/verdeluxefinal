import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { json2csv } from "json-2-csv";

export const exportUsersToCsv = baseProcedure.query(async () => {
  const users = await db.user.findMany();
  const csv = await json2csv(users);
  return csv;
});
