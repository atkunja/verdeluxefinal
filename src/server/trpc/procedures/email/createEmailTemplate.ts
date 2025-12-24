import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const createEmailTemplate = baseProcedure
  .input(
    z.object({
      name: z.string(),
      subject: z.string(),
      body: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const emailTemplate = await db.emailTemplate.create({ data: input });
    return emailTemplate;
  });
