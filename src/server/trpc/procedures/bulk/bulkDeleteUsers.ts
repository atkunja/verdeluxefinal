import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const bulkDeleteUsers = baseProcedure
  .input(z.object({ userIds: z.array(z.number()) }))
  .mutation(async ({ input }) => {
    const deletedUsers = await db.user.deleteMany({
      where: {
        id: { in: input.userIds },
      },
    });

    return deletedUsers;
  });
