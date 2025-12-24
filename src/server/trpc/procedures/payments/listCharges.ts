import { requireAdmin } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";

export const listCharges = requireAdmin.query(async () => {
  const intents = await stripe.paymentIntents.list({
    limit: 50,
  });

  const charges = intents.data.filter((i) => i.status === "succeeded" || i.status === "processing");
  return charges.map((c) => ({
    id: c.id,
    amount: (c.amount_received || c.amount) / 100,
    currency: c.currency,
    status: c.status,
    description: c.description,
    bookingId: c.metadata?.bookingId,
    created: c.created ? new Date(c.created * 1000) : null,
    paymentMethod: formatPaymentMethod(c),
    paymentIntentId: c.id,
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
