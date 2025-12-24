import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookingWizardProvider, useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { WizardLayout } from "~/components/bookings/wizard/WizardLayout";
import { SummaryPanel } from "~/components/bookings/wizard/SummaryPanel";
import { CLEANLINESS_LABELS } from "~/components/bookings/wizard/bookingDraft";
import { buttonPrimary, helperText } from "~/components/bookings/wizard/styles";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";

export const Route = createFileRoute("/booking-quiz/clean/cleanliness")({
  component: CleanlinessPage,
});

function CleanlinessContent() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useBookingDraft();

  React.useEffect(() => {
    bookingAnalytics.stepViewed("create-clean-cleanliness");
  }, []);

  return (
    <WizardLayout step={1} summary={<SummaryPanel draft={draft} />}>
      <div>
        <h1 className="text-2xl font-semibold">How clean is your home right now?</h1>
        <p className={`${helperText} mt-2`}>Move the slider to help us plan time.</p>
      </div>
      <div className="rounded-2xl border border-[#e3ded2] bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#163022]">Dirty</span>
          <span className="rounded-full bg-[#f0eadd] px-3 py-1 text-xs font-semibold text-[#163022]">
            {CLEANLINESS_LABELS[draft.cleanliness]}
          </span>
          <span className="text-sm font-semibold text-[#163022]">Clean</span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={draft.cleanliness}
          onChange={(e) => updateDraft({ cleanliness: Number(e.target.value) })}
          className="mt-6 w-full accent-[#163022]"
        />
      </div>
      <button
        type="button"
        className={`${buttonPrimary} mt-6 w-full md:w-auto`}
        onClick={() => navigate({ to: "/booking-quiz/clean/household" })}
      >
        Select &rarr;
      </button>
    </WizardLayout>
  );
}

function CleanlinessPage() {
  return <CleanlinessContent />;
}
