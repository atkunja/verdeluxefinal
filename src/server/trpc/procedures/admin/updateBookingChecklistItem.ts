import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const updateBookingChecklistItem = requireAdmin
  .input(
    z.object({
      itemId: z.number(),
      description: z.string().optional(),
      order: z.number().int().optional(),
      isCompleted: z.boolean().optional(),
      completedBy: z.number().nullable().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const item = await db.bookingChecklistItem.findUnique({
      where: { id: input.itemId },
    });
    if (!item) {
      throw new Error("Checklist item not found");
    }

    const updated = await db.bookingChecklistItem.update({
      where: { id: input.itemId },
      data: {
        description: input.description ?? item.description,
        order: input.order ?? item.order,
        isCompleted: input.isCompleted ?? item.isCompleted,
        completedBy: input.completedBy ?? item.completedBy,
        completedAt:
          input.isCompleted === undefined
            ? item.completedAt
            : input.isCompleted
              ? new Date()
              : null,
      },
    });

    return { item: updated };
  });
