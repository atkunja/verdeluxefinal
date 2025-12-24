import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const createLeadSource = requireAdmin
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
        return db.leadSourceCategory.create({
            data: { name: input.name },
        });
    });
