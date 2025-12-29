import { requireAdmin } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";
import { db } from "~/server/db";
import type Stripe from "stripe";

export const listHolds = requireAdmin.query(async () => {
  const intents = await stripe.paymentIntents.list({
    limit: 50,
    // capture_method is not filterable on list; we'll filter client-side
  });

  const holdsRaw = intents.data.filter((i) => i.capture_method === "manual" && i.status === "requires_capture");

  // Extract booking IDs from metadata
  const bookingIds = holdsRaw
    .map(i => i.metadata?.bookingId)
    .filter(Boolean)
    .map(id => Number(id));

  // Fetch bookings and clients in one go
  const bookings = await db.booking.findMany({
    where: { id: { in: bookingIds } },
    include: { client: true }
  });

  const bookingMap = new Map(bookings.map(b => [b.id, b]));

  return holdsRaw.map((h) => {
    const bId = h.metadata?.bookingId ? Number(h.metadata.bookingId) : null;
    const booking = bId ? bookingMap.get(bId) : null;

    return {
      id: h.id,
      amount: h.amount / 100,
      currency: h.currency,
      status: h.status,
      description: h.description,
      bookingId: bId,
      created: h.created ? new Date(h.created * 1000) : null,
      paymentMethod: formatPaymentMethod(h),
      paymentIntentId: h.id,
      customer: {
        name: booking?.client ? `${booking.client.firstName} ${booking.client.lastName}`.trim() : "Unknown",
        email: booking?.client?.email || "",
        phone: booking?.client?.phone || "",
      },
      location: booking?.address || "",
    };
  });
});

function formatPaymentMethod(intent: Stripe.PaymentIntent) {
  const pm = intent.payment_method;
  const charges = (intent as any).charges?.data || [];
  const details = charges[0]?.payment_method_details;
  if (details?.card) {
    return `Card • ${details.card.last4 ?? pm ?? ""}`;
  }
  if (details?.type) return details.type;
  if (typeof pm === "string") return pm;
  return "Unknown";
}
