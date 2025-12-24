import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const deleteChecklistTemplate = requireAdmin
  .input(
    z.object({
      templateId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const template = await db.checklistTemplate.findUnique({
      where: { id: input.templateId },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    await db.checklistTemplate.delete({
      where: { id: input.templateId },
    });

    return { success: true };
  });
