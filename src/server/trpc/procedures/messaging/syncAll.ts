
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

        // Cache for the duration of this sync
        const contactCache = new Map<string, any>();

        // 2. Paginate through conversations
        do {
            if (convPage > 2) break; // Optimization: Only scan first 2 pages (100 conversations)

            const convData = await openPhone.getConversations(nextPageToken);
            const conversations = (convData.data || []) as any[];
            nextPageToken = convData.nextPageToken;

            if (conversations.length === 0) break;

            // Sequential processing to avoid 429 burst penalties
            for (const conv of conversations) {
                // Skip conversation if it hasn't had activity since our last sync
                const lastActivity = conv.lastActivityAt ? new Date(conv.lastActivityAt) :
                    (conv.updatedAt ? new Date(conv.updatedAt) : null);

                if (sinceDate && lastActivity && lastActivity <= sinceDate) {
                    continue;
                }

                const participants = (conv.participants || [])
                    .map((p: any) => typeof p === 'object' ? p.phoneNumber : p)
                    .filter((p: string | undefined) => {
                        if (!p || typeof p !== 'string') return false;
                        const normalized = p.replace(/\D/g, "");
                        const systemDigits = systemPhone.replace(/\D/g, "");
                        return normalized !== systemDigits && normalized.length > 5;
                    });

                if (participants.length === 0) continue;

                // Sync messages
                try {
                    const msgsData = await openPhone.getMessages(participants, undefined);
                    const messages = (msgsData.data || []) as any[];

                    for (const msg of messages) {
                        if (sinceDate && new Date(msg.createdAt) <= sinceDate) {
                            break;
                        }
                        const result = await openPhone.upsertMessage(msg, adminId, { contactCache });
                        if (result) msgCount++;
                    }
                } catch (err: any) {
                    // Silently continue locally as _request handles retries
                }
            }

            // Reached old conversations page
            const lastConv = conversations[conversations.length - 1];
            const lastPageActivity = lastConv.lastActivityAt ? new Date(lastConv.lastActivityAt) : null;
            if (sinceDate && lastPageActivity && lastPageActivity <= sinceDate) {
                break;
            }

            convPage++;
        } while (nextPageToken);

        if (msgCount > 0) console.log(`[Sync] Completed. Synced ${msgCount} new messages.`);
        return { success: true, count: msgCount, messageCount: msgCount };
    } catch (error: any) {
        console.error("Sync Error:", error);
        return { success: false, error: error.message };
    }
});
