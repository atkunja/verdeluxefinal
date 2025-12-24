import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getCalls = requireAdmin
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ input }) => {
        return await db.callLog.findMany({
            where: input.userId ? {
                contactId: input.userId
            } : {},
            orderBy: { createdAt: 'desc' }
        });
    });
