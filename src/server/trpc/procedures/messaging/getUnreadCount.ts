import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getUnreadCount = baseProcedure
  .input(z.object({ userId: z.number() }))
  .query(async ({ input }) => {
    const count = await db.message.count({
      where: {
        recipientId: input.userId,
        isRead: false,
      },
    });

    return { count };
  });
