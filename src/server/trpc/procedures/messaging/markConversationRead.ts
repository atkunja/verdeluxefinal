import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const markConversationRead = requireAdmin
    .input(z.object({ contactId: z.number() }))
    .mutation(async ({ input }) => {
        const messages = await db.message.updateMany({
            where: {
                senderId: input.contactId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return { count: messages.count };
    });
