import { defineEventHandler, readBody, getHeader } from "@tanstack/react-start/server";
import { openPhone } from "~/server/services/openphone";

export default defineEventHandler(async (event) => {
    try {
        if (event.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        const body = await readBody(event);
        const signature = getHeader(event, "x-openphone-signature");
        const bodyString = typeof body === "string" ? body : JSON.stringify(body);

        console.log("[Webhook] Received Request:", {
            hasSignature: !!signature,
            bodyLength: bodyString.length,
            preview: bodyString.slice(0, 100)
        });

        // Verify signature if secret is configured
        if (signature) {
            const isValid = await openPhone.verifySignature(bodyString, signature);
            console.log("[Webhook] Signature verification:", isValid ? "PASS" : "FAIL");
            if (!isValid) {
                return new Response("Invalid signature", { status: 401 });
            }
        } else {
            console.warn("[Webhook] Missing x-openphone-signature header");
        }

        const payload = typeof body === "string" ? JSON.parse(body) : body;
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
            console.log("[Webhook] Message upsert result:", result ? "SUCCESS" : "SKIPPED (no contact phone)");
        } else if (type.startsWith("call.")) {
            const call = data.object;
            const result = await openPhone.upsertCall(call, adminId);
            console.log("[Webhook] Call upsert result:", result ? "SUCCESS" : "SKIPPED (no contact phone)");
        }

        return new Response("OK", { status: 200 });
    } catch (err: any) {
        console.error("[Webhook] OpenPhone processing error:", err);
        return new Response(`Error: ${err.message}`, { status: 500 });
    }
});
