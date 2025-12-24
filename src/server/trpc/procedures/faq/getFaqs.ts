import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getFaqs = baseProcedure.query(async () => {
  const faqs = await db.fAQ.findMany();
  return faqs;
});
