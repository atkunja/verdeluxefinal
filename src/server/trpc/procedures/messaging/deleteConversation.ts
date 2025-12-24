import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const deleteConversation = requireAdmin
    .input(z.object({ contactId: z.number() }))
    .mutation(async ({ input }) => {
        // Delete all messages between current user (admin) and the contact
        // Note: In our current sync system, adminId might vary if multiple admins sync,
        // but typically the communications view shows all messages for that contact.
        // To truly "delete conversation" for the system, we delete all messages 
        // involving this contactId.

        await db.message.deleteMany({
            where: {
                OR: [
                    { senderId: input.contactId },
                    { recipientId: input.contactId }
                ]
            }
        });

        await db.callLog.deleteMany({
            where: {
                contactId: input.contactId
            }
        });

        return { success: true };
    });
