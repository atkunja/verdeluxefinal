import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const markMessageRead = baseProcedure
  .input(z.object({ messageId: z.number() }))
  .mutation(async ({ input }) => {
    const message = await db.message.update({
      where: { id: input.messageId },
      data: { isRead: true, readAt: new Date() },
    });

    return message;
  });
