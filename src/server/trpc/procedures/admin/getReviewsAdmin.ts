import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getReviewsAdmin = requireAdmin.query(async () => {
    const reviews = await db.review.findMany({
        include: {
            booking: {
                include: {
                    client: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return reviews;
});
