import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const getQuizSubmissions = requireAdmin.query(async () => {
    const submissions = await db.cleanQuizSubmission.findMany({
        orderBy: { createdAt: "desc" },
    });

    return submissions;
});
