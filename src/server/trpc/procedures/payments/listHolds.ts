import { requireAdmin } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";

export const listHolds = requireAdmin.query(async () => {
  const intents = await stripe.paymentIntents.list({
    limit: 50,
    // capture_method is not filterable on list; we'll filter client-side
  });

  const holds = intents.data.filter((i) => i.capture_method === "manual");
  return holds.map((h) => ({
    id: h.id,
    amount: h.amount / 100,
    currency: h.currency,
    status: h.status,
    description: h.description,
    bookingId: h.metadata?.bookingId,
    created: h.created ? new Date(h.created * 1000) : null,
    paymentMethod: formatPaymentMethod(h),
    paymentIntentId: h.id,
  }));
});

function formatPaymentMethod(intent: Stripe.PaymentIntent) {
  const pm = intent.payment_method;
  const charges = intent.charges?.data || [];
  const details = charges[0]?.payment_method_details;
  if (details?.card) {
    return `Card • ${details.card.last4 ?? pm ?? ""}`;
  }
  if (details?.type) return details.type;
  if (typeof pm === "string") return pm;
  return "Unknown";
}
