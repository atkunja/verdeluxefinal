import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const updateContact = requireAdmin
    .input(z.object({
        contactId: z.number(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
        const { contactId, ...data } = input;

        const user = await db.user.update({
            where: { id: contactId },
            data,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                notes: true,
                isPinned: true
            }
        });

        return { user };
    });
