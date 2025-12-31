import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const togglePinContact = requireAdmin
    .input(z.object({
        contactId: z.number(),
    }))
    .mutation(async ({ input }) => {
        const currentUser = await db.user.findUnique({
            where: { id: input.contactId },
            select: { isPinned: true }
        });

        if (!currentUser) {
            throw new Error("Contact not found");
        }

        const user = await db.user.update({
            where: { id: input.contactId },
            data: {
                isPinned: !currentUser.isPinned
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                isPinned: true
            }
        });

        return { user };
    });
