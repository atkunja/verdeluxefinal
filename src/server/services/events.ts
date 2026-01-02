import { db } from "../db";
import { logAction } from "./logger";
import { sendEmail } from "./email";
import { format } from "date-fns";

export type EventType = "booking.created" | "booking.modified" | "booking.cancelled";

export type EventPayload = {
    bookingId: number;
    userId?: number;
    changes?: {
        before?: any;
        after?: any;
    };
};

export async function trackEvent(type: EventType, payload: EventPayload) {
    const booking = await db.booking.findUnique({
        where: { id: payload.bookingId },
        include: { client: true },
    });

    if (!booking) return;

    // 1. Log the action
    await logAction({
        userId: payload.userId,
        action: type,
        entity: "Booking",
        entityId: payload.bookingId,
        before: payload.changes?.before,
        after: payload.changes?.after,
    });

    // 2. Trigger automated emails
    const context = {
        bookingId: booking.id,
        clientName: `${booking.client?.firstName ?? ""} ${booking.client?.lastName ?? ""}`.trim(),
        scheduledDate: format(new Date(booking.scheduledDate), "MMM do, yyyy"),
        scheduledTime: booking.scheduledTime,
        status: booking.status,
    };

    if (type === "booking.created") {
        await sendEmail({
            to: booking.client?.email || "",
            templateType: "booking_create",
            context,
        });
    } else if (type === "booking.cancelled") {
        await sendEmail({
            to: booking.client?.email || "",
            templateType: "booking_cancel",
            context,
        });
    } else if (type === "booking.modified") {
        // Option to add booking_modify template later
        await sendEmail({
            to: booking.client?.email || "",
            templateType: "booking_modify",
            context,
            fallbackSubject: `Update to your booking #${booking.id}`,
            fallbackBody: `Hi ${context.clientName}, your booking #${booking.id} has been updated to ${context.scheduledDate} at ${context.scheduledTime}.`,
        });
    }
}
