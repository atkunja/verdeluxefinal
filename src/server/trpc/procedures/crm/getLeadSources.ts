import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getLeadSources = baseProcedure
    .query(async () => {
        return db.leadSourceCategory.findMany({
            orderBy: { name: "asc" },
        });
    });
