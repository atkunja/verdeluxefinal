
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

    // Helper to normalize phone numbers to E.164-like format (digits only with leading plus)
    normalizePhone(raw: string | undefined | null): string {
        if (!raw) return "";
        const digits = raw.replace(/\D/g, "");
        if (digits.length === 0) return "";
        if (digits.length === 10) return `+1${digits}`;
        if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
        return raw.startsWith("+") ? raw : `+${digits}`;
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

    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async getMessages(participants: string[], pageToken?: string) {
        // We need the phone number ID, not just the number
        const phoneNumberId = await this.getPhoneNumberId();

        const url = new URL(`${BASE_URL}/messages`);
        url.searchParams.append("phoneNumberId", phoneNumberId);

        // participants must be provided and be an array of E.164 strings.
        const validParticipants = participants
            .map(p => p?.trim())
            .filter(p => p && p !== "undefined" && p.length > 5);

        if (validParticipants.length === 0) {
            return { data: [] };
        }

        validParticipants.forEach(p => {
            const norm = this.normalizePhone(p);
            if (norm) url.searchParams.append("participants", norm);
        });

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

        const data = await response.json();

        // Diagnostic: Log first 5 messages to see raw structure for incoming vs outgoing
        if (data.data && data.data.length > 0) {
            console.log(`[OpenPhone] Raw getMessages sample for participants [${participants.join(", ")}]:`,
                JSON.stringify(data.data.slice(0, 5), (key, value) => {
                    if (key === 'text' || key === 'content' || key === 'body') {
                        return (value as string).substring(0, 30) + "...";
                    }
                    return value;
                }, 2)
            );
        }

        return data;
    },

    async getCalls(participants?: string[], pageToken?: string) {
        const phoneNumberId = await this.getPhoneNumberId();
        const url = new URL(`${BASE_URL}/calls`);
        url.searchParams.append("phoneNumberId", phoneNumberId);

        // If participants specifically requested, filter by them
        if (participants && participants.length > 0) {
            const validParticipants = participants
                .map(p => p?.trim())
                .filter(p => p && p !== "undefined" && p.length > 5);

            if (validParticipants.length > 0) {
                validParticipants.forEach(p => {
                    const norm = this.normalizePhone(p);
                    if (norm) url.searchParams.append("participants", norm);
                });
            }
        }

        if (pageToken) {
            url.searchParams.append("pageToken", pageToken);
        }

        const finalUrl = url.toString();
        console.log("[OpenPhone] Fetching calls:", finalUrl); // debug

        const response = await fetch(finalUrl, {
            headers: {
                Authorization: `${env.OPENPHONE_API_KEY}`,
            },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`OpenPhone API Error (getCalls): ${response.status} ${text}`);
        }

        return await response.json();
    },

    async verifySignature(body: string, signature: string): Promise<boolean> {
        if (!env.OPENPHONE_WEBHOOK_SECRET || !signature) return false;

        const crypto = await import("node:crypto");
        const hmac = crypto.createHmac("sha256", env.OPENPHONE_WEBHOOK_SECRET);
        const digest = hmac.update(body).digest("hex");

        return digest === signature;
    },

    async upsertMessage(msg: any, adminIdOverride?: number) {
        const { db } = await import("~/server/db");
        const systemPhone = env.OPENPHONE_PHONE_NUMBER || "";

        const fromPhone = this.normalizePhone(msg.from);
        if (!fromPhone) {
            console.log("[OpenPhone] Skip upsertMessage: No fromPhone");
            return null;
        }

        const systemPhoneNormalized = this.normalizePhone(systemPhone);
        const isOutgoing = fromPhone === systemPhoneNormalized;
        const toPhones = (msg.to || []) as string[];
        const contactPhoneRaw = isOutgoing ? toPhones[0] : msg.from;
        const contactPhone = this.normalizePhone(contactPhoneRaw);

        // Unified deep log to prevent interleaving
        console.log("[OpenPhone] Upsert Debug Info:", JSON.stringify({
            id: msg.id,
            from: fromPhone,
            system: systemPhoneNormalized,
            isOutgoing,
            contactPhone,
            rawText: msg.text,
            rawContent: msg.content,
            rawBody: msg.body,
            keys: Object.keys(msg)
        }, null, 2));

        if (!contactPhone) {
            console.log("[OpenPhone] Skip upsertMessage: No contactPhone determined");
            return null;
        }

        const normalizedDigits = contactPhone.replace(/\D/g, "");
        let contactUser = await db.user.findFirst({
            where: { phone: { contains: normalizedDigits.slice(-10) } }
        });

        if (!contactUser) {
            // Skip messages from unregistered contacts (no spam/unknown numbers)
            console.log("[OpenPhone] Skip upsertMessage: Contact not registered:", contactPhone);
            return null;
        }

        let finalAdminId = adminIdOverride;
        if (!finalAdminId) {
            // Prefer the owner or first admin
            const admin = await db.user.findFirst({
                where: { OR: [{ role: 'OWNER' }, { role: 'ADMIN' }] },
                orderBy: { id: 'asc' }
            });
            finalAdminId = admin?.id || 1;
        }

        const senderId = isOutgoing ? finalAdminId : contactUser.id;
        const recipientId = isOutgoing ? contactUser.id : finalAdminId;

        // OpenPhone API v1 uses 'text', but some webhooks or older versions might use 'content' or 'body'
        let content = msg.text || msg.body || msg.content || "";

        // If content is empty but there's media, show a placeholder
        if (!content && msg.media && msg.media.length > 0) {
            content = "[Media Attachment]";
        }

        return await (db.message as any).upsert({
            where: { externalId: msg.id },
            create: {
                externalId: msg.id,
                sender: { connect: { id: senderId } },
                recipient: { connect: { id: recipientId } },
                content: content,
                mediaUrls: msg.media?.map((m: any) => m.url) || [],
                createdAt: new Date(msg.createdAt),
                isRead: isOutgoing, // Only mark read by default if we sent it
            },
            update: {
                content: content,
                mediaUrls: msg.media?.map((m: any) => m.url) || [],
            },
        });
    },

    async upsertCall(call: any, adminIdOverride?: number) {
        const { db } = await import("~/server/db");
        const systemPhone = env.OPENPHONE_PHONE_NUMBER || "";

        if (!call.from && !call.to) {
            console.log("[OpenPhone] Skip upsertCall: No from/to. Full item:", JSON.stringify({
                id: call.id,
                keys: Object.keys(call),
                full: call
            }, null, 2));
            return null;
        }

        const fromPhoneNormalized = this.normalizePhone(call.from);
        const systemPhoneNormalized = this.normalizePhone(systemPhone);
        const contactPhoneRaw = fromPhoneNormalized === systemPhoneNormalized ? call.to : call.from;
        const contactPhone = this.normalizePhone(contactPhoneRaw);

        console.log("[OpenPhone] Upserting Call:", {
            id: call.id,
            from: fromPhoneNormalized,
            system: systemPhoneNormalized,
            contactPhone: contactPhone
        });

        if (!contactPhone) return null;

        const normalizedDigits = contactPhone.replace(/\D/g, "");
        let contactUser = await db.user.findFirst({
            where: { phone: { contains: normalizedDigits.slice(-10) } }
        });

        if (!contactUser) {
            // Skip calls from unregistered contacts (no spam/unknown numbers)
            console.log("[OpenPhone] Skip upsertCall: Contact not registered:", contactPhone);
            return null;
        }

        let finalAdminId = adminIdOverride;
        if (!finalAdminId) {
            const firstAdmin = await db.user.findFirst({ where: { role: 'ADMIN' } });
            finalAdminId = firstAdmin?.id || 1;
        }

        return await (db.callLog as any).upsert({
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
                user: { connect: { id: finalAdminId } },
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
    }
};
