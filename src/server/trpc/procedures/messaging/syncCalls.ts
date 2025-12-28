import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { openPhone } from "~/server/services/openphone";

export const syncCalls = requireAdmin.mutation(async ({ ctx }) => {
    try {
        // 1. Get all active conversations first
        const convData = await openPhone.getConversations();
        const conversations = (convData.data || []) as any[];
        let count = 0;
        const adminId = ctx.profile.id;
        const systemPhone = process.env.OPENPHONE_PHONE_NUMBER || "";

        // 2. Iterate through conversations to get calls
        for (const conv of conversations) {
            // Extract participants, excluding our own number
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
                // identify participants
                const fromPhone = call.from;
                const toPhone = call.to;
                const contactPhone = fromPhone === systemPhone ? toPhone : fromPhone;

                if (!contactPhone) continue;

                const normalized = contactPhone.replace(/\D/g, "");
                let contactUser = await db.user.findFirst({
                    where: {
                        phone: {
                            contains: normalized.slice(-10)
                        }
                    }
                });

                // 2.5 Create Guest User if not found
                if (!contactUser) {
                    contactUser = await db.user.create({
                        data: {
                            firstName: "Guest",
                            lastName: contactPhone,
                            phone: contactPhone,
                            email: `${normalized}@guest-call.v-luxe.com`,
                            password: "guest-no-login-permitted",
                            role: "CLIENT" as any
                        }
                    });
                }

                // 3. Upsert Call record
                await (db.callLog as any).upsert({
                    where: { externalId: call.id },
                    create: {
                        externalId: call.id,
                        direction: call.direction,
                        status: call.status,
                        duration: call.duration,
                        fromNumber: call.from,
                        toNumber: call.to,
                        recordingUrl: call.recording?.url,
                        startTime: new Date(call.createdAt),
                        user: { connect: { id: adminId } },
                        contact: { connect: { id: contactUser.id } },
                        transcript: call.transcript,
                        summary: call.summary,
                        voicemailUrl: call.voicemail?.url,
                    },
                    update: {
                        status: call.status,
                        duration: call.duration,
                        recordingUrl: call.recording?.url,
                        transcript: call.transcript,
                        summary: call.summary,
                        voicemailUrl: call.voicemail?.url,
                    }
                });
                count++;
            }
        }

        return { success: true, count };
    } catch (error) {
        console.error("Sync Calls Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
