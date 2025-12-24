import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getEmailTemplates = baseProcedure.query(async () => {
  const emailTemplates = await db.emailTemplate.findMany();
  return emailTemplates;
});
