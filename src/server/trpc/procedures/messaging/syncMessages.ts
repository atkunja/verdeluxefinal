
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

            // Process this page of conversations in parallel with a concurrency limit
            const BATCH_SIZE = 5;
            for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
                const batch = conversations.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(async (conv) => {
                    // Skip if the conversation hasn't been updated since our last sync
                    if (sinceDate && conv.updatedAt && new Date(conv.updatedAt) <= sinceDate) {
                        return;
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

                    if (participants.length === 0) return;

                    // Sync messages for each conversation
                    let msgPageToken: string | undefined = undefined;
                    // Most incremental syncs only need 1 page, we'll cap at 2 for performance
                    for (let pCount = 0; pCount < 2; pCount++) {
                        const msgsData = await openPhone.getMessages(participants, msgPageToken);
                        const messages = (msgsData.data || []) as any[];
                        msgPageToken = msgsData.nextPageToken;

                        let hasReachedOldMessages = false;
                        // Parallelize upserts within a message page
                        await Promise.all(messages.map(async (msg) => {
                            if (sinceDate && new Date(msg.createdAt) <= sinceDate) {
                                hasReachedOldMessages = true;
                            }
                            await openPhone.upsertMessage(msg, adminId);
                            count++;
                        }));

                        if (!msgPageToken || hasReachedOldMessages) break;
                    }
                }));
            }
            convPage++;
        } while (nextPageToken);

        return { success: true, count };
    } catch (error) {
        console.error("Sync Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
