
import { openPhone } from "./src/server/services/openphone";
import { env } from "./src/server/env";

async function debugMessages() {
    try {
        console.log("Fetching conversations...");
        const convData = await openPhone.getConversations();
        const conversations = convData.data || [];

        for (const conv of conversations) {
            const participants = (conv.participants || [])
                .map((p: any) => typeof p === "object" ? p.phoneNumber : p)
                .filter((p: string | undefined) => !!p);

            console.log(`Checking conversation with: ${participants.join(", ")}`);
            const msgData = await openPhone.getMessages(participants);
            const messages = msgData.data || [];

            const hasOutgoing = messages.some((m: any) => m.direction === "outgoing");
            if (hasOutgoing) {
                console.log(`Found conversation with outgoing messages! (Participants: ${participants.join(", ")})`);
                for (const msg of messages.filter((m: any) => m.direction === "outgoing").slice(0, 3)) {
                    console.log("--- Outgoing Message Object ---");
                    console.log(JSON.stringify(msg, null, 2));

                    const fromPhone = openPhone.normalizePhone(msg.from);
                    const systemPhone = openPhone.normalizePhone(env.OPENPHONE_PHONE_NUMBER);
                    const isOutgoing = fromPhone === systemPhone;

                    const toPhones = (msg.to || []);
                    const contactPhoneRaw = isOutgoing ? toPhones[0] : msg.from;
                    const contactPhone = openPhone.normalizePhone(contactPhoneRaw);

                    console.log("Debug Variables:", {
                        msgId: msg.id,
                        fromPhone,
                        systemPhone,
                        isOutgoing,
                        toPhones,
                        contactPhoneRaw,
                        contactPhone,
                        typeOfTo0: typeof toPhones[0]
                    });
                }
                return; // Stop after first match
            }
        }
    } catch (err) {
        console.error("Debug failed:", err);
    }
}

debugMessages();
