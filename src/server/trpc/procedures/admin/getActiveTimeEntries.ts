import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getActiveTimeEntries = baseProcedure
    .query(async () => {
        const activeEntries = await db.timeEntry.findMany({
            where: {
                endTime: null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                booking: {
                    select: {
                        id: true,
                        serviceType: true,
                        address: true,
                    },
                },
            },
        });

        return activeEntries;
    });
