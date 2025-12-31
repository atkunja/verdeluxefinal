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
            for (const callItem of calls) {
                // If we hit calls older than our last sync, we can stop after this batch
                if (sinceDate && new Date(callItem.createdAt) <= sinceDate) {
                    hasReachedOldCalls = true;
                    // continue to process batch to ensure 100% coverage
                }
                await openPhone.upsertCall(callItem, adminId);
                count++;
            }

            if (!nextPageToken || hasReachedOldCalls) break;
            pPage++;
            await openPhone.sleep(200);
        } while (nextPageToken);

        return { success: true, count };
    } catch (error) {
        console.error("Sync Calls Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
