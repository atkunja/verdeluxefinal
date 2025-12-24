import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const createLead = baseProcedure
  .input(
    z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
      source: z.string(),
      message: z.string(),
      status: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const lead = await db.lead.create({ data: input });
    return lead;
  });
