import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getPublicReviews = baseProcedure.query(async () => {
    const reviews = await db.review.findMany({
        where: {
            isPublic: true,
        },
        include: {
            booking: {
                select: {
                    client: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return reviews;
});
