import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { openPhone } from "~/server/services/openphone";

export const syncCalls = requireAdmin.mutation(async ({ ctx }) => {
    try {
        let count = 0;
        const adminId = ctx.profile.id;

        // Bulk fetch recent calls
        // This avoids making an API call per conversation
        const callsData = await openPhone.getCalls();
        const calls = (callsData.data || []) as any[];

        console.log(`[Sync] Bulk syncing ${calls.length} calls`);

        for (const call of calls) {
            await openPhone.upsertCall(call, adminId);
            count++;
        }

        return { success: true, count };
    } catch (error) {
        console.error("Sync Calls Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
