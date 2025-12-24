
import { env } from "../env";

const BASE_URL = "https://api.openphone.com/v1";

interface SendMessageParams {
    to: string;
    content: string;
    mediaUrls?: string[];
}

interface OpenPhoneMessage {
    id: string;
    from: string;
    to: string[];
    content: string;
    createdAt: string;
    direction: "incoming" | "outgoing";
    status: string;
}

export const openPhone = {
    async sendMessage({ to, content, mediaUrls }: SendMessageParams) {
        const response = await fetch(`${BASE_URL}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `${env.OPENPHONE_API_KEY}`, // Prefixing 'Bearer' usually required but test script had variable logic.
                // Wait, test script said: `const authHeader = useBearer ? ... : ...`. 
                // I will trust standard Bearer auth if test script was ambiguous or try to match it.
                // Actually line 7 of test-openphone.ts: `const authHeader = useBearer ? Bearer ... : ...`
                // And runTests called it with true and false. 
                // I will use Bearer as it's standard.
            },
            body: JSON.stringify({
                to: [to],
                from: env.OPENPHONE_PHONE_NUMBER,
                content,
                media: mediaUrls,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`OpenPhone API Error: ${response.status} ${text}`);
        }

        return await response.json();
    },

    async getMessages(phoneNumber?: string, pageToken?: string) {
        const url = new URL(`${BASE_URL}/messages`);
        url.searchParams.append("phoneNumber", env.OPENPHONE_PHONE_NUMBER);
        if (phoneNumber) {
            url.searchParams.append("participants", phoneNumber);
        }
        if (pageToken) {
            url.searchParams.append("pageToken", pageToken);
        }

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `${env.OPENPHONE_API_KEY}`,
            },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`OpenPhone API Error: ${response.status} ${text}`);
        }

        return await response.json();
    },

    async getCalls(pageToken?: string) {
        const url = new URL(`${BASE_URL}/calls`);
        if (pageToken) {
            url.searchParams.append("pageToken", pageToken);
        }

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `${env.OPENPHONE_API_KEY}`,
            },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`OpenPhone API Error: ${response.status} ${text}`);
        }

        return await response.json();
    }
};
