
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

        console.log(`[Sync] Starting full pagination message sync...`);

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

                // Sync first 2 pages of messages for each conversation (latest ~100)
                let msgPageToken: string | undefined = undefined;
                for (let pCount = 0; pCount < 2; pCount++) {
                    const msgsData = await openPhone.getMessages(participants, msgPageToken);
                    const messages = (msgsData.data || []) as any[];
                    msgPageToken = msgsData.nextPageToken;

                    for (const msg of messages) {
                        await openPhone.upsertMessage(msg, adminId);
                        count++;
                    }

                    if (!msgPageToken) break;
                    await openPhone.sleep(100); // Small delay between message pages
                }

                // Throttling: Wait 500ms before next conversation
                await openPhone.sleep(500);
            }
            convPage++;
        } while (nextPageToken);

        return { success: true, count };
    } catch (error) {
        console.error("Sync Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
