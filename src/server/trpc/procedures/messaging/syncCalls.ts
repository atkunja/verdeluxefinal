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

            // Process batch of conversations - reduced batch size to avoid rate limits
            const BATCH_SIZE = 2;
            for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
                const batch = conversations.slice(i, i + BATCH_SIZE);
                // Process sequentially instead of in parallel to avoid rate limits
                for (const conv of batch) {
                    // Extract participants similar to syncMessages
                    const participants = (conv.participants || [])
                        .map((p: any) => typeof p === 'object' ? p.phoneNumber : p)
                        .filter((p: string | undefined) => {
                            if (!p || typeof p !== 'string') return false;
                            const normalized = p.replace(/\D/g, "");
                            const systemDigits = (env.OPENPHONE_PHONE_NUMBER || "").replace(/\D/g, "");
                            return normalized !== systemDigits && normalized.length > 5;
                        });

                    if (participants.length === 0) continue;

                    // Fetch calls for these participants
                    try {
                        const callData = await openPhone.getCalls(participants, undefined);
                        const calls = (callData.data || []) as any[];

                        for (const callItem of calls) {
                            if (sinceDate && new Date(callItem.createdAt) <= sinceDate) {
                                break;
                            }
                            await openPhone.upsertCall(callItem, adminId);
                            count++;
                        }
                    } catch (err: any) {
                        if (err.message?.includes('429')) {
                            console.log('[Sync] Rate limited, waiting 5s...');
                            await openPhone.sleep(5000);
                        } else {
                            throw err;
                        }
                    }

                    // Delay between each conversation to avoid rate limits
                    await openPhone.sleep(300);
                }
                // Delay between batches
                await openPhone.sleep(500);
            }

            pPage++;
            await openPhone.sleep(500);
        } while (nextPageToken);

        return { success: true, count };
    } catch (error) {
        console.error("Sync Calls Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
