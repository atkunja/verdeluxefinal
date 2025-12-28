
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { openPhone } from "~/server/services/openphone";

export const syncMessages = requireAdmin.mutation(async ({ ctx }) => {
    try {
        // 1. Get all active conversations first
        const convData = await openPhone.getConversations();
        const conversations = (convData.data || []) as any[];
        let count = 0;
        const adminId = ctx.profile.id;
        const systemPhone = process.env.OPENPHONE_PHONE_NUMBER || "";

        // 2. Iterate through conversations to get messages
        for (const conv of conversations) {
            // Extract participants, excluding our own number. Handle both object and string array formats.
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
        }

        return { success: true, count };
    } catch (error) {
        console.error("Sync Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
