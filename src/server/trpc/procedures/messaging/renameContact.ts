import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const renameContact = requireAdmin
    .input(z.object({
        contactId: z.number(),
        firstName: z.string().min(1),
        lastName: z.string().optional()
    }))
    .mutation(async ({ input }) => {
        const user = await db.user.update({
            where: { id: input.contactId },
            data: {
                firstName: input.firstName,
                lastName: input.lastName || ""
            },
            select: {
                id: true,
                firstName: true,
                lastName: true
            }
        });

        return { user };
    });
