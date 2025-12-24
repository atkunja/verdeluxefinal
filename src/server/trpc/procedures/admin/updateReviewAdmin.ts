import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const updateReviewAdmin = requireAdmin
    .input(
        z.object({
            id: z.number(),
            isPublic: z.boolean().optional(),
            comment: z.string().optional(),
            rating: z.number().min(1).max(5).optional(),
        })
    )
    .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updated = await db.review.update({
            where: { id },
            data,
        });
        return updated;
    });
