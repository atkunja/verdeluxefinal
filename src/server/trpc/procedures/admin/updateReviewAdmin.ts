import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { logAction } from "~/server/services/logger";

export const updateReviewAdmin = requireAdmin
    .input(
        z.object({
            id: z.number(),
            isPublic: z.boolean().optional(),
            comment: z.string().optional(),
            rating: z.number().min(1).max(5).optional(),
        })
    )
    .mutation(async ({ input, ctx }) => {
        const existing = await db.review.findUnique({ where: { id: input.id } });
        if (!existing) throw new Error("Review not found");

        const { id, ...data } = input;
        const updated = await db.review.update({
            where: { id },
            data,
        });

        await logAction({
            userId: ctx.profile.id,
            action: "review.updated",
            entity: "Review",
            entityId: id,
            before: existing,
            after: updated,
        });

        return updated;
    });
