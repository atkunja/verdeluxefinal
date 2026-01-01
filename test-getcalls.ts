
import { openPhone } from "./src/server/services/openphone";

async function run() {
    console.log("Testing getCalls with undefined participants...");
    try {
        const calls = await openPhone.getCalls(undefined);
        console.log("Success with undefined:", calls ? "Got response" : "No response");
    } catch (err: any) {
        console.error("Error with undefined:", err.message);
    }

    console.log("Testing getCalls with empty array...");
    try {
        const calls = await openPhone.getCalls([]);
        console.log("Success with []:", calls ? "Got response" : "No response");
    } catch (err: any) {
        console.error("Error with []:", err.message);
    }
}

run();
