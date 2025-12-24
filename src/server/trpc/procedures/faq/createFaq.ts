import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const createFaq = baseProcedure
  .input(
    z.object({
      question: z.string(),
      answer: z.string(),
      category: z.string(),
      order: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const faq = await db.fAQ.create({ data: input });
    return faq;
  });
