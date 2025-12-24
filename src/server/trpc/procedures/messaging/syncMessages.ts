
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { openPhone } from "~/server/services/openphone";

export const syncMessages = requireAdmin.mutation(async ({ ctx }) => {
    try {
        const data = await openPhone.getMessages();
        const messages = (data.data || []) as any[];
        let count = 0;

        const adminId = ctx.profile.id;

        for (const msg of messages) {
            // 1. Identify participants
            const fromPhone = msg.from;
            const toPhones = (msg.to || []) as string[];
            const systemPhone = process.env.OPENPHONE_PHONE_NUMBER || "";
            const contactPhone = fromPhone === systemPhone ? toPhones[0] : fromPhone;

            if (!contactPhone) continue;

            // 2. Normalize and find User
            // E.164 normalization for matching
            const normalized = contactPhone.replace(/\D/g, "");
            let contactUser = await db.user.findFirst({
                where: {
                    phone: {
                        contains: normalized.slice(-10) // Match last 10 digits to be safe
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
                        email: `${normalized}@guest.v-luxe.com`, // Placeholder email
                        password: "guest-no-login-permitted", // Placeholder
                        role: "CLIENT" as any
                    }
                });
            }

            const isOutgoing = fromPhone === systemPhone;
            const senderId = isOutgoing ? adminId : contactUser.id;
            const recipientId = isOutgoing ? contactUser.id : adminId;

            // 3. Upsert
            await (db.message as any).upsert({
                where: {
                    externalId: msg.id,
                },
                create: {
                    externalId: msg.id,
                    sender: { connect: { id: senderId } },
                    recipient: { connect: { id: recipientId } },
                    content: msg.content || "",
                    mediaUrls: msg.media?.map((m: any) => m.url) || [],
                    createdAt: new Date(msg.createdAt),
                    isRead: true,
                },
                update: {
                    content: msg.content || "",
                    mediaUrls: msg.media?.map((m: any) => m.url) || [],
                },
            });
            count++;
        }

        return { success: true, count };
    } catch (error) {
        console.error("Sync Error:", error);
        return { success: false, error: (error as Error).message };
    }
});
