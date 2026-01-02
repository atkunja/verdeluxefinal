import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { sendEmail } from "~/server/services/email";
import { db } from "~/server/db";

export const sendAddCardLink = requireAdmin
    .input(
        z.object({
            bookingId: z.number(),
        })
    )
    .mutation(async ({ input }: { input: { bookingId: number } }) => {
        const booking = await db.booking.findUnique({
            where: { id: input.bookingId },
            include: {
                client: { select: { email: true, firstName: true } },
            },
        });

        if (!booking || !booking.client) {
            throw new Error("Booking or client not found");
        }

        const to = booking.client.email;
        if (!to) {
            throw new Error("No client email");
        }

        const link = `${process.env.NEXT_PUBLIC_APP_URL || "https://verdeluxe.com"}/client-portal`;

        const subject = `Update Payment Method for Booking #${booking.id}`;
        const body = `Hi ${booking.client.firstName ?? ""},

We need you to update your payment method for your upcoming booking #${booking.id}.

Please log in to your client portal to manage your payment details securely:
${link}

If you have any questions, please reply to this email.`;

        await sendEmail({
            to,
            templateType: "ADD_CARD_LINK",
            fallbackSubject: subject,
            fallbackBody: body,
        });

        return { success: true };
    });
