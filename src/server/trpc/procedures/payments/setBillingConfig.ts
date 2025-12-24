import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const setBillingConfig = requireAdmin
  .input(
    z.object({
      holdDelayHours: z.number().int().nonnegative().optional().nullable(),
    })
  )
  .mutation(async ({ input }) => {
    const config = await db.billingConfig.upsert({
      where: { id: 1 },
      update: { holdDelayHours: input.holdDelayHours ?? null },
      create: { id: 1, holdDelayHours: input.holdDelayHours ?? null },
    });
    return config;
  });
