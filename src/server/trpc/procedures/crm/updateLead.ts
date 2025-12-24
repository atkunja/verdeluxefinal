import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const updateLead = baseProcedure
  .input(
    z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      source: z.enum(["GOOGLE_LSA", "THUMBTACK", "FACEBOOK_AD", "REDDIT", "NEXTDOOR", "WEBSITE", "REFERRAL"]).optional(),
      message: z.string().optional(),
      status: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { id, ...data } = input;
    const lead = await db.lead.update({
      where: { id },
      data,
    });
    return lead;
  });
