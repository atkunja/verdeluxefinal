import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookingWizardProvider, useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { WizardLayout } from "~/components/bookings/wizard/WizardLayout";
import { SummaryPanel } from "~/components/bookings/wizard/SummaryPanel";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";
import { CLEAN_TYPES } from "~/components/bookings/wizard/bookingDraft";
import { CleanTypeCard } from "~/components/bookings/wizard/controls";
import { buttonPrimary, helperText } from "~/components/bookings/wizard/styles";
import { calculatePricing } from "~/components/bookings/wizard/pricing";

export const Route = createFileRoute("/booking-quiz/clean/type")({
  component: CleanTypePage,
});

function CleanTypeContent() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useBookingDraft();

  React.useEffect(() => {
    bookingAnalytics.stepViewed("create-clean-type");
  }, []);

  return (
    <WizardLayout step={1} summary={<SummaryPanel draft={draft} />}>
      <div>
        <h1 className="text-2xl font-semibold">Choose your clean.</h1>
        <p className={`${helperText} mt-2`}>Pick the experience that best fits your home.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {CLEAN_TYPES.map((item) => (
          <CleanTypeCard
            key={item.id}
            item={item}
            selected={draft.cleanType === item.id}
            onSelect={() => {
              const nextDraft = { ...draft, cleanType: item.id };
              updateDraft({
                cleanType: item.id,
                pricing: calculatePricing(nextDraft),
              });
              bookingAnalytics.selectionMade("clean-type", item.id);
            }}
          />
        ))}
      </div>
      <button
        type="button"
        className={`${buttonPrimary} mt-6 w-full md:w-auto`}
        onClick={() => navigate({ to: "/booking-quiz/clean/beds-baths" })}
      >
        Select &rarr;
      </button>
    </WizardLayout>
  );
}

function CleanTypePage() {
  return <CleanTypeContent />;
}
