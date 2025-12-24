import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookingWizardProvider, useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { WizardLayout } from "~/components/bookings/wizard/WizardLayout";
import { SummaryPanel } from "~/components/bookings/wizard/SummaryPanel";
import { YesNoToggle } from "~/components/bookings/wizard/controls";
import { buttonPrimary, helperText } from "~/components/bookings/wizard/styles";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";

export const Route = createFileRoute("/booking-quiz/clean/household")({
  component: HouseholdPage,
});

function HouseholdContent() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useBookingDraft();

  React.useEffect(() => {
    bookingAnalytics.stepViewed("create-clean-household");
  }, []);

  return (
    <WizardLayout step={1} summary={<SummaryPanel draft={draft} />}>
      <div>
        <h1 className="text-2xl font-semibold">Who else lives in your home with you?</h1>
        <p className={`${helperText} mt-2`}>Let us know if there are kids or pets.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <YesNoToggle
          label="Kids"
          value={draft.kids}
          onChange={(value) => updateDraft({ kids: value })}
        />
        <YesNoToggle
          label="Pets"
          value={draft.pets}
          onChange={(value) => updateDraft({ pets: value })}
        />
      </div>
      <button
        type="button"
        className={`${buttonPrimary} mt-6 w-full md:w-auto`}
        onClick={() => navigate({ to: "/booking-quiz/clean/summary" })}
      >
        Next -
      </button>
    </WizardLayout>
  );
}

function HouseholdPage() {
  return <HouseholdContent />;
}


