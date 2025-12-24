import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const deleteUserAdmin = requireAdmin
  .input(
    z.object({
      userId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const target = await db.user.findUnique({ where: { id: input.userId } });
    if (!target) {
      throw new Error("User not found");
    }

    await db.user.delete({ where: { id: input.userId } });
    return { success: true };
  });
