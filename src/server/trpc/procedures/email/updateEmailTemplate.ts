import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const updateEmailTemplate = baseProcedure
  .input(
    z.object({
      id: z.number(),
      name: z.string().optional(),
      subject: z.string().optional(),
      body: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { id, ...data } = input;
    const emailTemplate = await db.emailTemplate.update({
      where: { id },
      data,
    });
    return emailTemplate;
  });
