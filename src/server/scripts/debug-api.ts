import { openPhone } from "../services/openphone";
import { env } from "../env";

async function debug() {
    console.log("Using Phone Number:", env.OPENPHONE_PHONE_NUMBER);

    try {
        const convs = await openPhone.getConversations();
        const data = convs.data || [];
        console.log(`Found ${data.length} conversations.`);

        if (data.length > 0) {
            const conv = data[0];
            const participants = (conv.participants || []).map((p: any) => typeof p === 'object' ? p.phoneNumber : p);
            console.log("Fetching messages for participants:", participants);

            const msgs = await openPhone.getMessages(participants);
            const msgList = msgs.data || [];
            console.log(`Found ${msgList.length} messages.`);

            if (msgList.length > 0) {
                const firstMsg = msgList[0];
                console.log("FIRST MESSAGE FULL OBJECT:");
                console.log(JSON.stringify(firstMsg, null, 2));
                console.log("Keys:", Object.keys(firstMsg));
                console.log("Content field value:", firstMsg.content);
                console.log("Body field value:", (firstMsg as any).body);
                console.log("Text field value:", (firstMsg as any).text);
            }
        }
    } catch (err) {
        console.error("API Debug Error:", err);
    }
}

debug();
