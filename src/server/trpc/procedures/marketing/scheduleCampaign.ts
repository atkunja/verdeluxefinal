import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";

export const scheduleCampaign = baseProcedure
  .input(
    z.object({
      campaignId: z.number(),
      sendAt: z.date(),
    })
  )
  .mutation(async ({ input }) => {
    // This is a placeholder. A real implementation would schedule the campaign to be sent.
    console.log("Scheduling campaign...");
    return { success: true };
  });
