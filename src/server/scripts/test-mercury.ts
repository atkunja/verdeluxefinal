import "dotenv/config.js";

const MERCURY_API_KEY = process.env.MERCURY_API_KEY;
const MERCURY_API_BASE = process.env.MERCURY_API_BASE || "https://api.mercury.com";

async function testMercuryConnection() {
    console.log("Testing Mercury API connection...");
    console.log("API Base:", MERCURY_API_BASE);
    console.log("API Key present:", !!MERCURY_API_KEY);
    console.log("");

    if (!MERCURY_API_KEY) {
        console.error("❌ MERCURY_API_KEY not set in .env");
        return;
    }

    try {
        const url = `${MERCURY_API_BASE}/v1/accounts`;
        console.log("Fetching:", url);

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${MERCURY_API_KEY}`,
                "Content-Type": "application/json",
            },
        });

        console.log("Status:", res.status, res.statusText);
        const body = await res.text();

        if (res.ok) {
            console.log("✅ Connection successful!");
            console.log("Response:", JSON.parse(body));
        } else {
            console.error("❌ API Error:", body);
        }
    } catch (err: any) {
        console.error("❌ Connection failed:", err.message);
    }
}

testMercuryConnection();
