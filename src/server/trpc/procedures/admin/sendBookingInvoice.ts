import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { sendEmail } from "~/server/services/email";
import { db } from "~/server/db";

export const sendBookingInvoice = requireAdmin
    .input(
        z.object({
            bookingId: z.number(),
            email: z.string().email().optional(),
        })
    )
    .mutation(async ({ input }) => {
        const booking = await db.booking.findUnique({
            where: { id: input.bookingId },
            include: {
                client: { select: { email: true, firstName: true, lastName: true } },
            },
        });
        if (!booking) {
            throw new Error("Booking not found");
        }
        const to = input.email || booking.client?.email;
        if (!to) {
            throw new Error("No recipient email");
        }

        const subject = `Invoice for booking #${booking.id}`;
        const body = `Hi ${booking.client?.firstName ?? ""},

Please find the invoice for your upcoming booking #${booking.id}.
Service: ${booking.serviceType}
Date: ${booking.scheduledDate.toLocaleDateString()}
Time: ${booking.scheduledTime}
Balance Due: $${(booking.finalPrice ?? 0).toFixed(2)}

You can pay via the client portal. If you have questions, please reply to this email.`;

        await sendEmail({
            to,
            templateType: "BOOKING_INVOICE",
            fallbackSubject: subject,
            fallbackBody: body,
        });

        return { success: true };
    });
