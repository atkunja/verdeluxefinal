import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getAllCleanerAvailability = requireAdmin.query(async () => {
    const availability = await db.cleanerAvailability.findMany({
        include: {
            cleaner: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    color: true,
                },
            },
        },
    });

    return availability;
});
