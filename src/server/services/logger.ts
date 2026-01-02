import { db } from "../db";

export type LogPayload = {
    userId?: number;
    action: string;
    entity: string;
    entityId?: number;
    before?: any;
    after?: any;
};

export async function logAction(payload: LogPayload) {
    try {
        await db.systemLog.create({
            data: {
                userId: payload.userId,
                action: payload.action,
                entity: payload.entity,
                entityId: payload.entityId,
                before: payload.before ? JSON.parse(JSON.stringify(payload.before)) : undefined,
                after: payload.after ? JSON.parse(JSON.stringify(payload.after)) : undefined,
            },
        });
    } catch (error) {
        console.error("Failed to create system log:", error);
    }
}
