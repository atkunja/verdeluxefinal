import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const deleteLeadSource = requireAdmin
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
        return db.leadSourceCategory.delete({
            where: { id: input.id },
        });
    });
