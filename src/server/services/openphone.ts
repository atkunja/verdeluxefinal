
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
        if (!env.OPENPHONE_API_KEY || !env.OPENPHONE_PHONE_NUMBER) {
            console.log(`[OpenPhone Mock] Sending SMS to ${to}: "${content}"`);
            return { id: "mock_msg_" + Date.now(), status: "sent", direction: "outgoing" };
        }
        return this._request(`${BASE_URL}/messages`, {
            method: "POST",
            body: JSON.stringify({
                to: [to],
                from: env.OPENPHONE_PHONE_NUMBER,
                content,
                media: mediaUrls,
            }),
        });
    },

    async _request(url: string, options: any = {}, retryCount = 0): Promise<any> {
        const headers = {
            "Content-Type": "application/json",
            Authorization: `${env.OPENPHONE_API_KEY}`,
            ...options.headers,
        };

        const response = await fetch(url, { ...options, headers });

        if (response.status === 429) {
            if (retryCount >= 3) {
                const text = await response.text();
                throw new Error(`OpenPhone API Rate Limit Exceeded after 3 retries: ${text}`);
            }
            const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
            console.log(`[OpenPhone] 429 Rate Limit. Retrying in ${delay}ms... (Attempt ${retryCount + 1})`);
            await this.sleep(delay);
            return this._request(url, options, retryCount + 1);
        }

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

        if (!env.OPENPHONE_API_KEY) return "mock_phone_id";
        const data = await this._request(`${BASE_URL}/phone-numbers`);
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
        if (!env.OPENPHONE_API_KEY) return { data: [] };
        const phoneNumberId = await this.getPhoneNumberId();
        const url = new URL(`${BASE_URL}/conversations`);
        url.searchParams.append("phoneNumberId", phoneNumberId);

        if (pageToken) {
            url.searchParams.append("pageToken", pageToken);
        }

        return await this._request(url.toString());
    },

    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async getMessages(participants: string[], pageToken?: string) {
        if (!env.OPENPHONE_API_KEY) return { data: [] };
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

        const data = await this._request(url.toString());


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

        return await this._request(url.toString());
    },

    async verifySignature(body: string, signature: string): Promise<boolean> {
        if (!env.OPENPHONE_WEBHOOK_SECRET || !signature) return false;

        const crypto = await import("node:crypto");
        const hmac = crypto.createHmac("sha256", env.OPENPHONE_WEBHOOK_SECRET);
        const digest = hmac.update(body).digest("hex");

        return digest === signature;
    },

    async upsertMessage(msg: any, adminId: number, options?: { contactCache?: Map<string, any> }) {
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


        if (!contactPhone) {
            console.log("[OpenPhone] Skip upsertMessage: No contactPhone determined");
            return null;
        }

        const normalizedDigits = contactPhone.replace(/\D/g, "");
        const cacheKey = normalizedDigits.slice(-10);
        let contactUser = options?.contactCache?.get(cacheKey);

        if (!contactUser) {
            contactUser = await db.user.findFirst({
                where: { phone: { contains: cacheKey } }
            });

            if (!contactUser) {
                // If not found in User, check Lead table
                const lead = await db.lead.findFirst({
                    where: { phone: { contains: cacheKey } }
                });

                if (lead) {
                    console.log("[OpenPhone] Creating User from Lead:", contactPhone);
                    contactUser = await db.user.create({
                        data: {
                            firstName: lead.name.split(' ')[0] || "Lead",
                            lastName: lead.name.split(' ').slice(1).join(' ') || contactPhone,
                            phone: contactPhone,
                            email: lead.email || `${normalizedDigits}@lead.luxeclean.com`,
                            password: "lead-no-login-permitted",
                            role: "CLIENT" as any
                        }
                    });
                }
            }

            if (contactUser && options?.contactCache) {
                options.contactCache.set(cacheKey, contactUser);
            }
        }

        if (!contactUser) {
            console.log("[OpenPhone] Creating Contact User for unknown number:", contactPhone);
            contactUser = await db.user.create({
                data: {
                    firstName: "Contact",
                    lastName: contactPhone,
                    phone: contactPhone,
                    email: `${normalizedDigits}@contact.luxeclean.com`,
                    password: "contact-no-login-permitted",
                    role: "CLIENT" as any
                }
            });
            if (options?.contactCache) {
                options.contactCache.set(cacheKey, contactUser);
            }
        }

        const senderId = isOutgoing ? adminId : contactUser.id;
        const recipientId = isOutgoing ? contactUser.id : adminId;

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

    async upsertCall(call: any, adminId: number, options?: { contactCache?: Map<string, any> }) {
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
        const cacheKey = normalizedDigits.slice(-10);
        let contactUser = options?.contactCache?.get(cacheKey);

        if (!contactUser) {
            contactUser = await db.user.findFirst({
                where: { phone: { contains: cacheKey } }
            });

            if (!contactUser) {
                // If not found in User, check Lead table
                const lead = await db.lead.findFirst({
                    where: { phone: { contains: cacheKey } }
                });

                if (lead) {
                    console.log("[OpenPhone] Creating User from Lead:", contactPhone);
                    contactUser = await db.user.create({
                        data: {
                            firstName: lead.name.split(' ')[0] || "Lead",
                            lastName: lead.name.split(' ').slice(1).join(' ') || contactPhone,
                            phone: contactPhone,
                            email: lead.email || `${normalizedDigits}@lead.luxeclean.com`,
                            password: "lead-no-login-permitted",
                            role: "CLIENT" as any
                        }
                    });
                }
            }

            if (contactUser && options?.contactCache) {
                options.contactCache.set(cacheKey, contactUser);
            }
        }

        const isOutgoingCall = fromPhoneNormalized === systemPhoneNormalized;

        if (!contactUser) {
            console.log("[OpenPhone] Creating Contact User for unknown number (Call):", contactPhone);
            contactUser = await db.user.create({
                data: {
                    firstName: "Contact",
                    lastName: contactPhone,
                    phone: contactPhone,
                    email: `${normalizedDigits}@contact.luxeclean.com`,
                    password: "contact-no-login-permitted",
                    role: "CLIENT" as any
                }
            });
            if (options?.contactCache) {
                options.contactCache.set(cacheKey, contactUser);
            }
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
                user: { connect: { id: adminId } },
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
