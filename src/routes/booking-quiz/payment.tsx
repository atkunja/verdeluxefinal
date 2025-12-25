import React, { useMemo } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import toast from "react-hot-toast";
import { BookingWizardProvider, useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { WizardLayout } from "~/components/bookings/wizard/WizardLayout";
import { SummaryPanel } from "~/components/bookings/wizard/SummaryPanel";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";
import { buttonPrimary } from "~/components/bookings/wizard/styles";
import { calculatePricing } from "~/components/bookings/wizard/pricing";
import { useTRPC } from "~/trpc/react";

export const Route = createFileRoute("/booking-quiz/payment")({
  component: PaymentPage,
});

// No longer using top-level loadStripe because env vars may be missing at build time

function StripeSetupForm({ onComplete }: { onComplete: (setupIntentId: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = React.useState(false);

  return (
    <div className="space-y-4">
      <PaymentElement />
      <button
        type="button"
        className={`${buttonPrimary} w-full`}
        onClick={async () => {
          if (!stripe || !elements) return;
          setProcessing(true);
          const { error, setupIntent } = await stripe.confirmSetup({
            elements,
            confirmParams: { return_url: typeof window !== "undefined" ? window.location.href : undefined },
            redirect: "if_required",
          });
          if (error) {
            toast.error(error.message || "Payment setup failed");
            setProcessing(false);
            return;
          }
          if (setupIntent?.id) {
            onComplete(setupIntent.id);
          }
          setProcessing(false);
        }}
        disabled={!stripe || processing}
      >
        {processing ? "Saving..." : "Save Payment Method"}
      </button>
    </div>
  );
}

function PaymentContent() {
  const navigate = useNavigate();
  const trpc = useTRPC();

  const { data: config } = useQuery(trpc.system.getPublicConfig.queryOptions(undefined, {
    staleTime: Infinity,
  }));

  const stripeKey = (config?.stripePublishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) as string | undefined;

  const stripePromise = useMemo(() => {
    if (!stripeKey) return null;
    return loadStripe(stripeKey);
  }, [stripeKey]);

  const { draft, updateDraft } = useBookingDraft();
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = React.useState<string | null>(null);
  const createSetupIntent = useMutation(trpc.stripe.createSetupIntent.mutationOptions());

  React.useEffect(() => {
    bookingAnalytics.stepViewed("payment");
  }, []);

  React.useEffect(() => {
    updateDraft({ pricing: calculatePricing(draft) });
  }, [draft, updateDraft]);

  React.useEffect(() => {
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) return;
    if (clientSecret || createSetupIntent.isPending) return;
    createSetupIntent.mutate(
      { customerEmail: draft.contact.email },
      {
        onSuccess: (data) => {
          setClientSecret(data.clientSecret || null);
          if (data.setupIntentId) setSetupIntentId(data.setupIntentId);
        },
        onError: (err) => toast.error(err.message || "Failed to start payment"),
      }
    );
  }, [clientSecret, createSetupIntent, draft.contact.email]);

  const createBooking = useMutation(trpc.booking.createBookingFromQuiz.mutationOptions());

  // Sanity check: If we somehow got here without an email (e.g. hard refresh cleared draft but kept route), redirect to start
  React.useEffect(() => {
    if (!draft.contact.email) {
      toast.error("Session expired or missing details. Restarting...");
      navigate({ to: "/booking-quiz/start" });
    }
  }, [draft.contact.email, navigate]);

  return (
    <WizardLayout step={5} summary={<SummaryPanel draft={draft} />}>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Payment</h1>
        <div className="rounded-2xl border border-[#e3ded2] bg-white p-5">
          <div className="text-sm font-semibold text-[#163022]">Booking review</div>
          <p className="mt-2 text-sm text-[#5c5a55]">Confirm your details before placing the booking.</p>
        </div>
        <div className="rounded-2xl border border-[#e3ded2] bg-white p-5">
          <div className="text-sm font-semibold text-[#163022]">Payment method</div>
          <p className="mt-2 text-sm text-[#5c5a55]">We'll only store your card for the upcoming booking. No charge in dev.</p>
          {stripePromise && clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripeSetupForm
                onComplete={(intentId) => {
                  setSetupIntentId(intentId);
                  toast.success("Payment method saved");
                }}
              />
            </Elements>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-[#e3ded2] px-4 py-3 text-sm text-[#5c5a55]">
              {!stripeKey ? "Loading payment system..." : "Add `VITE_STRIPE_PUBLISHABLE_KEY` to enable payment collection."}
            </div>
          )}
          <div className="mt-4 flex gap-2 text-xs text-[#5c5a55]">
            <span className="rounded bg-gray-100 px-2 py-1 font-semibold text-[#163022]">Affirm</span>
            <span className="rounded bg-gray-100 px-2 py-1 font-semibold text-[#163022]">Afterpay</span>
            <span className="rounded bg-gray-100 px-2 py-1 font-semibold text-[#163022]">Klarna</span>
          </div>
        </div>
        <button
          type="button"
          className={`${buttonPrimary} w-full md:w-auto`}
          disabled={createBooking.isPending}
          onClick={() => {
            bookingAnalytics.submitted(draft);
            createBooking.mutate(
              { draft },
              {
                onSuccess: () => {
                  toast.success("Booking placed successfully!");
                  navigate({ to: "/client-portal" });
                },
                onError: (err) => {
                  toast.error(err.message || "Failed to place booking");
                }
              }
            );
          }}
        >
          {createBooking.isPending ? "Placing booking..." : "Place booking"}
        </button>
      </div>
    </WizardLayout>
  );
}

function PaymentPage() {
  return <PaymentContent />;
}
