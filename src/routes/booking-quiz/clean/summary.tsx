import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookingWizardProvider, useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { WizardLayout } from "~/components/bookings/wizard/WizardLayout";
import { SummaryPanel } from "~/components/bookings/wizard/SummaryPanel";
import { CLEAN_TYPES, CLEANLINESS_LABELS } from "~/components/bookings/wizard/bookingDraft";
import { ExtrasSelector } from "~/components/bookings/wizard/controls";
import { calculatePricing } from "~/components/bookings/wizard/pricing";
import { buttonPrimary } from "~/components/bookings/wizard/styles";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";
import toast from "react-hot-toast";

export const Route = createFileRoute("/booking-quiz/clean/summary")({
  component: CleanSummaryPage,
});

function CleanSummaryContent() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useBookingDraft();
  const clean = CLEAN_TYPES.find((c) => c.id === draft.cleanType);
  const cleanDetails = [
    { label: "Beds", value: draft.beds, editTo: "/booking-quiz/clean/beds-baths" },
    { label: "Baths", value: draft.baths, editTo: "/booking-quiz/clean/beds-baths" },
    { label: "Pets", value: draft.pets ? "Yes" : "No", editTo: "/booking-quiz/clean/household" },
    { label: "Kids", value: draft.kids ? "Yes" : "No", editTo: "/booking-quiz/clean/household" },
    { label: "Cleanliness", value: CLEANLINESS_LABELS[draft.cleanliness], editTo: "/booking-quiz/clean/cleanliness" },
  ];

  const pricing = calculatePricing(draft);

  React.useEffect(() => {
    bookingAnalytics.stepViewed("create-clean-summary");
  }, []);

  return (
    <WizardLayout step={1} summary={<SummaryPanel draft={{ ...draft, pricing }} />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Clean Type</h1>
          <button
            type="button"
            onClick={() => navigate({ to: "/booking-quiz/clean/type" })}
            className="text-sm font-semibold text-[#163022] underline"
          >
            Edit
          </button>
        </div>
        <div className="rounded-2xl border border-[#e3ded2] bg-white p-5">
          <div className="text-lg font-semibold text-[#163022]">{clean?.title || ""}</div>
          <div className="mt-2 text-sm text-[#5c5a55]">What's included:</div>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#5c5a55]">
            <li>Kitchen wipe-down</li>
            <li>Bathrooms sanitized</li>
            <li>Floors vacuumed & mopped</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[#e3ded2] bg-[#f7f4ed] p-5">
          <div className="text-sm font-semibold text-[#163022]">Save 16%</div>
          <p className="mt-1 text-sm text-[#5c5a55]">Add a payment method to lock in member pricing.</p>
          <button
            type="button"
            onClick={() => toast("Membership features coming soon!", { icon: "💎" })}
            className="mt-3 rounded-lg border border-[#163022] px-3 py-1.5 text-sm font-semibold hover:bg-[#e3ded2]/50 transition-colors"
          >
            Add a payment method
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Clean Details</h2>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {cleanDetails.map((detail) => (
              <div key={detail.label} className="rounded-xl border border-[#e3ded2] bg-white p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-[#163022]">
                  <span>{detail.label}</span>
                  <button
                    type="button"
                    onClick={() => navigate({ to: detail.editTo })}
                    className="text-xs text-[#163022] underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="mt-2 text-sm text-[#5c5a55]">{detail.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Added Extras</h2>
            <span className="text-sm text-[#5c5a55]">Optional</span>
          </div>
          <div className="mt-3">
            <ExtrasSelector
              selected={draft.extras}
              onChange={(next) => {
                const nextDraft = { ...draft, extras: next };
                updateDraft({ extras: next, pricing: calculatePricing(nextDraft) });
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-[#e3ded2] bg-white p-5 text-lg font-semibold">
          <span>Total</span>
          <span>${pricing.total.toFixed(0)}</span>
        </div>

        <button
          type="button"
          className={`${buttonPrimary} w-full md:w-auto`}
          onClick={() => navigate({ to: "/booking-quiz/schedule" })}
        >
          Choose my time &rarr;
        </button>
      </div>
    </WizardLayout>
  );
}

function CleanSummaryPage() {
  return <CleanSummaryContent />;
}
