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

        // Create a cache for the duration of this sync to avoid redundant DB lookups
        const contactCache = new Map<string, any>();

        // 2. Paginate through ALL conversations to get participants
        do {
            console.log(`[Sync] Fetching conversation page ${pPage}...`);
            const convData = await openPhone.getConversations(nextPageToken);
            const conversations = (convData.data || []) as any[];
            nextPageToken = convData.nextPageToken;

            // Process batch of conversations - increased batch size for better throughput
            const BATCH_SIZE = 5;
            for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
                const batch = conversations.slice(i, i + BATCH_SIZE);

                // Process in parallel to speed up sync
                await Promise.all(batch.map(async (conv) => {
                    // Extract participants similar to syncMessages
                    const participants = (conv.participants || [])
                        .map((p: any) => typeof p === 'object' ? p.phoneNumber : p)
                        .filter((p: string | undefined) => {
                            if (!p || typeof p !== 'string') return false;
                            const normalized = p.replace(/\D/g, "");
                            const systemDigits = (env.OPENPHONE_PHONE_NUMBER || "").replace(/\D/g, "");
                            return normalized !== systemDigits && normalized.length > 5;
                        });

                    if (participants.length === 0) return;

                    // Fetch calls for these participants
                    try {
                        const callData = await openPhone.getCalls(participants, undefined);
                        const calls = (callData.data || []) as any[];

                        for (const callItem of calls) {
                            if (sinceDate && new Date(callItem.createdAt) <= sinceDate) {
                                break;
                            }
                            await openPhone.upsertCall(callItem, adminId, { contactCache });
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
                }));
            }

            pPage++;
        } while (nextPageToken);

        return { success: true, count };
    } catch (error) {
        console.error("Sync Calls Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
