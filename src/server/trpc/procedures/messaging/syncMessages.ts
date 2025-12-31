
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { openPhone } from "~/server/services/openphone";
import { env } from "~/server/env";

export const syncMessages = requireAdmin.mutation(async ({ ctx }) => {
    try {
        let count = 0;
        const adminId = ctx.profile.id;
        const systemPhone = env.OPENPHONE_PHONE_NUMBER || "";
        let nextPageToken: string | undefined = undefined;
        let convPage = 1;

        // 1. Get the most recent message timestamp to enable incremental sync
        const lastMessage = await db.message.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        });
        const sinceDate = lastMessage?.createdAt;

        console.log(`[Sync] Starting ${sinceDate ? 'incremental' : 'full'} pagination message sync...`);
        if (sinceDate) console.log(`[Sync] Fetching messages since: ${sinceDate.toISOString()}`);

        // 2. Paginate through ALL conversations
        do {
            console.log(`[Sync] Fetching conversation page ${convPage}...`);
            const convData = await openPhone.getConversations(nextPageToken);
            const conversations = (convData.data || []) as any[];
            nextPageToken = convData.nextPageToken;

            for (const conv of conversations) {
                // Skip if the conversation hasn't been updated since our last sync
                if (sinceDate && conv.updatedAt && new Date(conv.updatedAt) <= sinceDate) {
                    continue;
                }

                // Extract participants 
                const participants = (conv.participants || [])
                    .map((p: any) => typeof p === 'object' ? p.phoneNumber : p)
                    .filter((p: string | undefined) => {
                        if (!p || typeof p !== 'string') return false;
                        const normalized = p.replace(/\D/g, "");
                        const systemDigits = systemPhone.replace(/\D/g, "");
                        return normalized !== systemDigits && normalized.length > 5;
                    });

                if (participants.length === 0) {
                    continue;
                }

                // Sync messages for each conversation
                let msgPageToken: string | undefined = undefined;
                // For incremental, we only need the latest page usually, but we'll check token
                for (let pCount = 0; pCount < 3; pCount++) {
                    const msgsData = await openPhone.getMessages(participants, msgPageToken);
                    const messages = (msgsData.data || []) as any[];
                    msgPageToken = msgsData.nextPageToken;

                    let hasReachedOldMessages = false;
                    for (const msg of messages) {
                        // Optimization: if we hit a message older than our last sync, we can potentially stop this conversation
                        if (sinceDate && new Date(msg.createdAt) <= sinceDate) {
                            hasReachedOldMessages = true;
                            // continue to process this batch just in case of overlaps, but set flag
                        }
                        await openPhone.upsertMessage(msg, adminId);
                        count++;
                    }

                    if (!msgPageToken || hasReachedOldMessages) break;
                    await openPhone.sleep(100);
                }

                await openPhone.sleep(200);
            }
            convPage++;
        } while (nextPageToken);

        return { success: true, count };
    } catch (error) {
        console.error("Sync Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
