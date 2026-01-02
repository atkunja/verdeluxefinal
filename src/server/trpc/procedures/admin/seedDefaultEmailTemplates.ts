import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

const defaults = [
  {
    type: "booking_create",
    name: "Booking Created",
    subject: "Your booking #{{bookingId}} is confirmed",
    body: "Hi {{clientName}}, your booking #{{bookingId}} for {{scheduledDate}} at {{scheduledTime}} is confirmed.",
  },
  {
    type: "booking_cancel",
    name: "Booking Cancelled",
    subject: "Your booking #{{bookingId}} has been cancelled",
    body: "Hi {{clientName}}, your booking #{{bookingId}} for {{scheduledDate}} was cancelled. Contact support if this was unexpected.",
  },
  {
    type: "ADD_CARD_LINK",
    name: "Update Payment Method",
    subject: "Update Payment Method for Booking #{{bookingId}}",
    body: "Hi {{clientName}},\n\nPlease update your payment method for booking #{{bookingId}}.\n\nLink: {{link}}",
  },
  {
    type: "BOOKING_RECEIPT",
    name: "Booking Receipt",
    subject: "Receipt for booking #{{bookingId}}",
    body: "Hi {{clientName}},\n\nHere is your receipt for booking #{{bookingId}}.\n\nTotal: {{amount}}",
  },
  {
    type: "BOOKING_INVOICE",
    name: "Booking Invoice",
    subject: "Invoice for booking #{{bookingId}}",
    body: "Hi {{clientName}},\n\nHere is your invoice for booking #{{bookingId}}.\n\nBalance Due: {{amount}}",
  },
];

export const seedDefaultEmailTemplates = requireAdmin.mutation(async () => {
  let created = 0;
  for (const tpl of defaults) {
    const existing = await db.emailTemplate.findFirst({ where: { type: tpl.type } });
    if (!existing) {
      await db.emailTemplate.create({ data: tpl });
      created++;
    }
  }
  return { created };
});
