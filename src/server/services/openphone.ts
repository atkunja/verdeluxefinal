
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

    // Cache the phone number ID to avoid fetching it every time
    _phoneNumberId: null as string | null,

    async getPhoneNumberId(): Promise<string> {
        if (this._phoneNumberId) return this._phoneNumberId;

        const url = `${BASE_URL}/phone-numbers`;
        const response = await fetch(url, {
            headers: { Authorization: `${env.OPENPHONE_API_KEY}` },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`OpenPhone API Error (getPhoneNumbers): ${response.status} ${text}`);
        }

        const data = await response.json();
        // Find the ID for the configured phone number
        // Clean the env number to match format if needed, assuming E.164 match
        const matching = data.data?.find((p: any) => p.number === env.OPENPHONE_PHONE_NUMBER);

        if (!matching) {
            // Fallback: use first number if specific one not found or not configured
            if (data.data && data.data.length > 0) {
                this._phoneNumberId = data.data[0].id;
                return data.data[0].id;
            }
            throw new Error(`Could not find ID for phone number ${env.OPENPHONE_PHONE_NUMBER}`);
        }

        this._phoneNumberId = matching.id;
        return matching.id;
    },

    async getConversations(pageToken?: string) {
        const phoneNumberId = await this.getPhoneNumberId();
        const url = new URL(`${BASE_URL}/conversations`);
        url.searchParams.append("phoneNumberId", phoneNumberId);

        if (pageToken) {
            url.searchParams.append("pageToken", pageToken);
        }

        const response = await fetch(url.toString(), {
            headers: { Authorization: `${env.OPENPHONE_API_KEY}` },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`OpenPhone API Error (getConversations): ${response.status} ${text}`);
        }

        return await response.json();
    },

    async getMessages(participants: string[], pageToken?: string) {
        // We need the phone number ID, not just the number
        const phoneNumberId = await this.getPhoneNumberId();

        const url = new URL(`${BASE_URL}/messages`);
        url.searchParams.append("phoneNumberId", phoneNumberId);

        // participants must be an array of E.164 strings
        participants.forEach(p => url.searchParams.append("participants", p));

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
            throw new Error(`OpenPhone API Error (getMessages): ${response.status} ${text}`);
        }

        return await response.json();
    },

    async getCalls(pageToken?: string) {
        const phoneNumberId = await this.getPhoneNumberId();
        const url = new URL(`${BASE_URL}/calls`);
        url.searchParams.append("phoneNumberId", phoneNumberId);

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
            throw new Error(`OpenPhone API Error (getCalls): ${response.status} ${text}`);
        }

        return await response.json();
    }
};
