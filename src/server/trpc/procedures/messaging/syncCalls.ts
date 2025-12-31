import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { openPhone } from "~/server/services/openphone";
import { env } from "~/server/env";

export const syncCalls = requireAdmin.mutation(async ({ ctx }) => {
    try {
        let count = 0;
        const adminId = ctx.profile.id;
        let nextPageToken: string | undefined = undefined;
        let pPage = 1;

        // 1. Get the most recent call timestamp to enable incremental sync
        const lastCall = await db.callLog.findFirst({
            orderBy: { startTime: 'desc' },
            select: { startTime: true }
        });
        const sinceDate = lastCall?.startTime;

        console.log(`[Sync] Starting ${sinceDate ? 'incremental' : 'full'} pagination call sync...`);

        // 2. Paginate through ALL calls (OpenPhone /calls endpoint lists all calls by default)
        do {
            console.log(`[Sync] Fetching call page ${pPage}...`);
            const callData = await openPhone.getCalls(undefined, nextPageToken);
            const calls = (callData.data || []) as any[];
            nextPageToken = callData.nextPageToken;

            let hasReachedOldCalls = false;
            // Parallelize database upserts for the entire batch
            await Promise.all(calls.map(async (callItem) => {
                if (sinceDate && new Date(callItem.createdAt) <= sinceDate) {
                    hasReachedOldCalls = true;
                }
                await openPhone.upsertCall(callItem, adminId);
                count++;
            }));

            if (!nextPageToken || hasReachedOldCalls) break;
            pPage++;
            // Small sleep to avoid hammering the DB too hard, but parallel is much faster
            await openPhone.sleep(100);
        } while (nextPageToken);

        return { success: true, count };
    } catch (error) {
        console.error("Sync Calls Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
