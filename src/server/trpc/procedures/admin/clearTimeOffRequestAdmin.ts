import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const clearTimeOffRequestAdmin = requireAdmin
  .input(
    z.object({
      requestId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const request = await db.timeOffRequest.findUnique({
      where: { id: input.requestId },
    });

    if (!request) {
      throw new Error("Request not found");
    }

    const updated = await db.timeOffRequest.update({
      where: { id: input.requestId },
      data: {
        isCleared: true,
      },
    });

    return { request: updated };
  });
