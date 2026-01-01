
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

        // Create a cache for the duration of this sync to avoid redundant DB lookups
        const contactCache = new Map<string, any>();

        // 2. Paginate through ALL conversations
        do {
            console.log(`[Sync] Fetching conversation page ${convPage}...`);
            const convData = await openPhone.getConversations(nextPageToken);
            const conversations = (convData.data || []) as any[];
            nextPageToken = convData.nextPageToken;

            // Process this page of conversations - increased batch size for speed
            const BATCH_SIZE = 5;
            for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
                const batch = conversations.slice(i, i + BATCH_SIZE);

                // Parallelize within the batch, but use sequential upserts per conversation to maintain order
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
                    try {
                        const msgsData = await openPhone.getMessages(participants, undefined);
                        const messages = (msgsData.data || []) as any[];

                        // Upsert messages sequentially within a conversation to ensure order/consistency
                        for (const msg of messages) {
                            if (sinceDate && new Date(msg.createdAt) <= sinceDate) {
                                break;
                            }
                            await openPhone.upsertMessage(msg, adminId, { contactCache });
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
            convPage++;
        } while (nextPageToken);

        return { success: true, count };
    } catch (error) {
        console.error("Sync Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
