import { defineEventHandler, readBody, getHeader, readRawBody } from "@tanstack/react-start/server";
import { openPhone } from "~/server/services/openphone";

export default defineEventHandler(async (event) => {
    try {
        if (event.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        // Get raw body for signature verification
        const rawBody = await readRawBody(event, "utf-8");
        const signature = getHeader(event, "x-openphone-signature");

        if (!rawBody) {
            console.warn("[Webhook] Empty body received");
            return new Response("Empty body", { status: 400 });
        }

        console.log("[Webhook] Received Request:", {
            hasSignature: !!signature,
            bodyLength: rawBody.length,
            preview: rawBody.slice(0, 100)
        });

        // Verify signature if secret is configured
        if (signature) {
            const isValid = await openPhone.verifySignature(rawBody, signature);
            console.log("[Webhook] Signature verification:", isValid ? "PASS" : "FAIL");

            // If signature fails, we still log for debugging but we might want to block in production
            // If the user hasn't set the secret in ENV, we should probably warn
        } else {
            console.warn("[Webhook] Missing x-openphone-signature header");
        }

        // Parse payload for processing
        const payload = JSON.parse(rawBody);
        const { type, data } = payload;
        console.log(`[Webhook] Event: ${type}, Object ID: ${data?.object?.id}`);

        // Fetch primary admin for context
        const { db } = await import("~/server/db");
        const admin = await db.user.findFirst({
            where: { OR: [{ role: "OWNER" }, { role: "ADMIN" }] },
            orderBy: { id: "asc" }
        });
        const adminId = admin?.id || 1;

        if (type.startsWith("message.")) {
            const message = data.object;
            const result = await openPhone.upsertMessage(message, adminId);
            if (result) {
                console.log(`[Webhook] Message ${message.id} synced: "${message.text?.substring(0, 20)}..."`);
            }
        } else if (type.startsWith("call.")) {
            const call = data.object;
            const result = await openPhone.upsertCall(call, adminId);
            if (result) {
                console.log(`[Webhook] Call ${call.id} synced`);
            }
        }

        return new Response("OK", { status: 200 });
    } catch (err: any) {
        console.error("[Webhook] OpenPhone processing error:", err);
        return new Response(`Error: ${err.message}`, { status: 500 });
    }
});
