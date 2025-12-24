import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getDocuments = baseProcedure.query(async () => {
  const documents = await db.document.findMany();
  return documents;
});
