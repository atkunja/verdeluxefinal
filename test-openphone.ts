import "dotenv/config";
import { env } from "./src/server/env";

async function testOpenPhone(useBearer: boolean) {
    console.log(`Testing OpenPhone API (${useBearer ? "With Bearer" : "Without Bearer"})...`);

    const authHeader = useBearer ? `Bearer ${env.OPENPHONE_API_KEY}` : env.OPENPHONE_API_KEY;

    const response = await fetch("https://api.openphone.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
        },
        body: JSON.stringify({
            to: [env.OPENPHONE_PHONE_NUMBER],
            from: env.OPENPHONE_PHONE_NUMBER,
            content: "Test message from debug script",
        }),
    });

    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Body: ${text}`);
}

async function runTests() {
    await testOpenPhone(true);
    await testOpenPhone(false);
}

runTests();
