import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookingWizardProvider, useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { WizardLayout } from "~/components/bookings/wizard/WizardLayout";
import { SummaryPanel } from "~/components/bookings/wizard/SummaryPanel";
import { Counter } from "~/components/bookings/wizard/controls";
import { buttonPrimary, helperText } from "~/components/bookings/wizard/styles";
import { calculatePricing } from "~/components/bookings/wizard/pricing";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";

export const Route = createFileRoute("/booking-quiz/clean/beds-baths")({
  component: BedsBathsPage,
});

function BedsBathsContent() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useBookingDraft();

  React.useEffect(() => {
    bookingAnalytics.stepViewed("create-clean-beds-baths");
  }, []);

  const updateCounts = (beds: number, baths: number) => {
    const nextDraft = { ...draft, beds, baths };
    updateDraft({ beds, baths, pricing: calculatePricing(nextDraft) });
  };

  return (
    <WizardLayout step={1} summary={<SummaryPanel draft={draft} />}>
      <div>
        <h1 className="text-2xl font-semibold">How many bedrooms and bathrooms are in your home?</h1>
        <p className={`${helperText} mt-2`}>For half baths, round up.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Counter
          label="Beds"
          value={draft.beds}
          min={0}
          onChange={(value) => updateCounts(value, draft.baths)}
        />
        <Counter
          label="Baths"
          value={draft.baths}
          min={1}
          onChange={(value) => updateCounts(draft.beds, value)}
        />
      </div>
      <button
        type="button"
        className={`${buttonPrimary} mt-6 w-full md:w-auto`}
        onClick={() => navigate({ to: "/booking-quiz/clean/cleanliness" })}
      >
        Next &rarr;
      </button>
    </WizardLayout>
  );
}

function BedsBathsPage() {
  return <BedsBathsContent />;
}
