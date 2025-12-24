import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const deleteReviewAdmin = requireAdmin
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
        await db.review.delete({
            where: { id: input.id },
        });
        return { success: true };
    });
