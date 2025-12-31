import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { openPhone } from "~/server/services/openphone";
import { env } from "~/server/env";

export const syncCalls = requireAdmin.mutation(async ({ ctx }) => {
    try {
        let count = 0;
        const adminId = ctx.profile.id;
        const systemPhone = env.OPENPHONE_PHONE_NUMBER || "";
        let nextPageToken: string | undefined = undefined;
        let convPage = 1;

        console.log(`[Sync] Starting full pagination call sync...`);

        // 1. Paginate through ALL conversations
        do {
            console.log(`[Sync] Fetching conversation page ${convPage}...`);
            const convData = await openPhone.getConversations(nextPageToken);
            const conversations = (convData.data || []) as any[];
            nextPageToken = convData.nextPageToken;

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

                // Sync first 2 pages of calls for each conversation
                let callPageToken: string | undefined = undefined;
                for (let pCount = 0; pCount < 2; pCount++) {
                    const callsData = await openPhone.getCalls(participants, callPageToken);
                    const calls = (callsData.data || []) as any[];
                    callPageToken = callsData.nextPageToken;

                    for (const call of calls) {
                        await openPhone.upsertCall(call, adminId);
                        count++;
                    }

                    if (!callPageToken) break;
                    await openPhone.sleep(100);
                }

                // Throttling: Wait 500ms before next conversation
                await openPhone.sleep(500);
            }
            convPage++;
        } while (nextPageToken);

        return { success: true, count };
    } catch (error) {
        console.error("Sync Calls Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
