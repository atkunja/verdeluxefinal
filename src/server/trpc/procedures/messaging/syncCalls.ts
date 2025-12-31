import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { openPhone } from "~/server/services/openphone";
import { env } from "~/server/env";

export const syncCalls = requireAdmin.mutation(async ({ ctx }) => {
    try {
        // 1. Get all active conversations
        const convData = await openPhone.getConversations();
        const conversations = (convData.data || []) as any[];
        let count = 0;
        const adminId = ctx.profile.id;
        const systemPhone = env.OPENPHONE_PHONE_NUMBER || "";

        console.log(`[Sync] Throttled syncing calls for ${conversations.length} conversations`);

        // 2. Iterate through conversations with a delay
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

            // Fetch calls for this specific conversation
            const callsData = await openPhone.getCalls(participants);
            const calls = (callsData.data || []) as any[];

            for (const call of calls) {
                await openPhone.upsertCall(call, adminId);
                count++;
            }

            // Throttling: Wait 500ms before next conversation
            await openPhone.sleep(500);
        }

        return { success: true, count };
    } catch (error) {
        console.error("Sync Calls Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
