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

        // 2. Paginate through ALL conversations to get participants
        do {
            console.log(`[Sync] Fetching conversation page ${pPage}...`);
            const convData = await openPhone.getConversations(nextPageToken);
            const conversations = (convData.data || []) as any[];
            nextPageToken = convData.nextPageToken;

            // Process batch of conversations
            const BATCH_SIZE = 5;
            for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
                const batch = conversations.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(async (conv) => {
                    // Extract participants similar to syncMessages
                    const participants = (conv.participants || [])
                        .map((p: any) => typeof p === 'object' ? p.phoneNumber : p)
                        .filter((p: string | undefined) => {
                            if (!p || typeof p !== 'string') return false;
                            const normalized = p.replace(/\D/g, "");
                            // Filter out our own number if needed, but getCalls needs the other party
                            const systemDigits = (env.OPENPHONE_PHONE_NUMBER || "").replace(/\D/g, "");
                            return normalized !== systemDigits && normalized.length > 5;
                        });

                    if (participants.length === 0) return;

                    // Fetch calls for these participants
                    // We only need 1 page of calls usually if running incrementally
                    const callData = await openPhone.getCalls(participants, undefined);
                    const calls = (callData.data || []) as any[];

                    let hasReachedOldCalls = false;
                    await Promise.all(calls.map(async (callItem) => {
                        if (sinceDate && new Date(callItem.createdAt) <= sinceDate) {
                            hasReachedOldCalls = true;
                        }
                        await openPhone.upsertCall(callItem, adminId);
                        count++;
                    }));
                }));
            }

            pPage++;
            await openPhone.sleep(100);
        } while (nextPageToken);

        return { success: true, count };
    } catch (error) {
        console.error("Sync Calls Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
