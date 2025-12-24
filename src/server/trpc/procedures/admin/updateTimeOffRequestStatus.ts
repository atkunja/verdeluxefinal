import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const updateTimeOffRequestStatus = requireAdmin
  .input(
    z.object({
      requestId: z.number(),
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
      adminNotes: z.string().nullable().optional(),
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
        status: input.status,
        adminNotes: input.adminNotes ?? null,
      },
    });

    return { request: updated };
  });
