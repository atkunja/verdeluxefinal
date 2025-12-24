import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const updateFaq = baseProcedure
  .input(
    z.object({
      id: z.number(),
      question: z.string().optional(),
      answer: z.string().optional(),
      category: z.string().optional(),
      order: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { id, ...data } = input;
    const faq = await db.fAQ.update({
      where: { id },
      data,
    });
    return faq;
  });
