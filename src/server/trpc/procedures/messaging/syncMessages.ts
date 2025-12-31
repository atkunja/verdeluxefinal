
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { openPhone } from "~/server/services/openphone";

export const syncMessages = requireAdmin.mutation(async ({ ctx }) => {
    try {
        let count = 0;
        const adminId = ctx.profile.id;

        // Bulk fetch recent messages (default is usually latest 50-100)
        // This avoids making an API call per conversation
        const msgsData = await openPhone.getMessages();
        const messages = (msgsData.data || []) as any[];

        console.log(`[Sync] Bulk syncing ${messages.length} messages`);

        for (const msg of messages) {
            await openPhone.upsertMessage(msg, adminId);
            count++;
        }

        return { success: true, count };
    } catch (error) {
        console.error("Sync Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
