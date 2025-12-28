import { defineEventHandler, readBody, getHeader } from "@tanstack/react-start/server";
import { openPhone } from "~/server/services/openphone";

export default defineEventHandler(async (event) => {
    try {
        if (event.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        const body = await readBody(event);
        const signature = getHeader(event, "x-openphone-signature");

        // Verify signature if secret is configured
        if (signature) {
            const rawBody = typeof body === "string" ? body : JSON.stringify(body);
            const isValid = await openPhone.verifySignature(rawBody, signature);
            if (!isValid) {
                console.warn("[Webhook] Invalid OpenPhone signature");
                return new Response("Invalid signature", { status: 401 });
            }
        }

        const { type, data } = body;
        console.log(`[Webhook] Received OpenPhone event: ${type}`);

        if (type.startsWith("message.")) {
            const message = data.object;
            await openPhone.upsertMessage(message);
        } else if (type.startsWith("call.")) {
            const call = data.object;
            await openPhone.upsertCall(call);
        }

        return new Response("OK", { status: 200 });
    } catch (err: any) {
        console.error("[Webhook] OpenPhone processing error:", err);
        return new Response(`Error: ${err.message}`, { status: 500 });
    }
});
