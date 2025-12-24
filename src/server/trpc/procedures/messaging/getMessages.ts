import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getMessages = requireAdmin
  .input(z.object({ userId: z.number().optional() }))
  .query(async ({ input }) => {
    const messages = await db.message.findMany({
      where: input.userId ? {
        OR: [
          { senderId: input.userId },
          { recipientId: input.userId },
        ],
      } : undefined, // No filter returns all
      orderBy: {
        createdAt: "asc",
      },
    });

    return messages;
  });
