import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const bulkUpdateUsers = baseProcedure
  .input(
    z.object({
      userIds: z.array(z.number()),
      data: z.object({
        role: z.enum(["CLIENT", "CLEANER", "ADMIN", "OWNER"]).optional(),
        // Add other fields that can be bulk-updated here
      }),
    })
  )
  .mutation(async ({ input }) => {
    const updatedUsers = await db.user.updateMany({
      where: {
        id: { in: input.userIds },
      },
      data: input.data,
    });

    return updatedUsers;
  });
