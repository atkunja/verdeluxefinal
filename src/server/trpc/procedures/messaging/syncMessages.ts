
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { openPhone } from "~/server/services/openphone";
import { env } from "~/server/env";

export const syncMessages = requireAdmin.mutation(async ({ ctx }) => {
    try {
        // 1. Get all active conversations
        const convData = await openPhone.getConversations();
        const conversations = (convData.data || []) as any[];
        let count = 0;
        const adminId = ctx.profile.id;
        const systemPhone = env.OPENPHONE_PHONE_NUMBER || "";

        console.log(`[Sync] Throttled syncing messages for ${conversations.length} conversations`);

        // 2. Iterate through conversations with a delay to stay under rate limits
        for (const conv of conversations) {
            // Extract participants 
            const participants = (conv.participants || [])
                .map((p: any) => typeof p === 'object' ? p.phoneNumber : p)
                .filter((p: string | undefined) => {
                    if (!p || typeof p !== 'string') return false;
                    const normalized = p.replace(/\D/g, "");
                    const systemDigits = systemPhone.replace(/\D/g, "");
                    return normalized !== systemDigits && normalized.length > 5;
                });

            if (participants.length === 0) continue;

            // Fetch messages for this specific conversation
            const msgsData = await openPhone.getMessages(participants);
            const messages = (msgsData.data || []) as any[];

            for (const msg of messages) {
                await openPhone.upsertMessage(msg, adminId);
                count++;
            }

            // Throttling: Wait 300ms before next conversation
            await openPhone.sleep(300);
        }

        return { success: true, count };
    } catch (error) {
        console.error("Sync Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
