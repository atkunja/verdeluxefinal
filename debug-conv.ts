
import { openPhone } from "./src/server/services/openphone";

async function debugConversations() {
    try {
        console.log("Fetching first page of conversations...");
        const convData = await openPhone.getConversations();
        const conv = convData.data?.[0];
        console.log("--- Conversation Object ---");
        console.log(JSON.stringify(conv, null, 2));
    } catch (err) {
        console.error("Debug failed:", err);
    }
}

debugConversations();
