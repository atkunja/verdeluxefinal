import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";
import { buttonPrimary, helperText, inputBase } from "~/components/bookings/wizard/styles";
import { QuizIdentityLayout } from "~/components/bookings/wizard/QuizIdentityLayout";

export const Route = createFileRoute("/booking-quiz/new/full-name")({
  component: FullNamePage,
});

function FullNameContent() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useBookingDraft();
  const [error, setError] = React.useState<string | null>(null);

  const handleNext = () => {
    if (!draft.contact.fullName?.trim()) {
      setError("Please enter your name to continue");
      return;
    }
    bookingAnalytics.selectionMade("full-name", draft.contact.fullName);
    navigate({ to: "/booking-quiz/new/email" });
  };

  return (
    <QuizIdentityLayout
      title="What's your name?"
      subtitle="We'll use this for your bespoke cleaning profile and future bookings."
    >
      <div className="space-y-6">
        <div>
          <label className="text-sm font-bold text-[#163022] uppercase tracking-wider">Full Name</label>
          <input
            className={`${inputBase} mt-2 py-4 text-lg border-2 focus:border-[#163022] transition-colors`}
            value={draft.contact.fullName || ""}
            onChange={(e) => {
              updateDraft({ contact: { ...draft.contact, fullName: e.target.value } });
              setError(null);
            }}
            placeholder="e.g. Jane Doe"
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            autoFocus
          />
          {error && <p className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </p>}
        </div>

        <button
          type="button"
          className={`${buttonPrimary} w-full py-4 text-lg shadow-xl active:scale-[0.98]`}
          onClick={handleNext}
        >
          Continue
        </button>

        <p className="text-center text-xs text-[#5c5a55]">
          Already have an account? <button type="button" onClick={() => navigate({ to: "/booking-quiz/returning/phone" })} className="font-bold underline">Sign in</button>
        </p>
      </div>
    </QuizIdentityLayout>
  );
}

function FullNamePage() {
  return <FullNameContent />;
}

