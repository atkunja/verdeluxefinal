
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { openPhone } from "~/server/services/openphone";
import { env } from "~/server/env";

export const syncAll = requireAdmin.mutation(async ({ ctx }) => {
    try {
        let msgCount = 0;
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

        console.log(`[Sync] Starting ${sinceDate ? 'incremental' : 'full'} message-only sync...`);

        // Cache for the duration of this sync
        const contactCache = new Map<string, any>();

        // 2. Paginate through ALL conversations
        do {
            console.log(`[Sync] Fetching conversation page ${convPage}...`);
            const convData = await openPhone.getConversations(nextPageToken);
            const conversations = (convData.data || []) as any[];
            nextPageToken = convData.nextPageToken;

            // Process this page of conversations
            const BATCH_SIZE = 5;
            for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
                const batch = conversations.slice(i, i + BATCH_SIZE);

                await Promise.all(batch.map(async (conv) => {
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

                    // Sync messages
                    try {
                        const msgsData = await openPhone.getMessages(participants, undefined);
                        const messages = (msgsData.data || []) as any[];

                        for (const msg of messages) {
                            if (sinceDate && new Date(msg.createdAt) <= sinceDate) {
                                break;
                            }
                            await openPhone.upsertMessage(msg, adminId, { contactCache });
                            msgCount++;
                        }
                    } catch (err: any) {
                        console.error("[Sync] Message sync error for conversation:", err.message);
                    }
                }));
                // Small breath between batches to be kind to the API
                await openPhone.sleep(500);
            }
            convPage++;
        } while (nextPageToken);

        return { success: true, count: msgCount, messageCount: msgCount };
    } catch (error: any) {
        console.error("Sync Error:", error);
        return { success: false, error: error.message };
    }
});
