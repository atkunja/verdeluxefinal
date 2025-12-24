import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookingWizardProvider, useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";
import { buttonPrimary, helperText, inputBase } from "~/components/bookings/wizard/styles";
import { QuizIdentityLayout } from "~/components/bookings/wizard/QuizIdentityLayout";

export const Route = createFileRoute("/booking-quiz/new/email")({
  component: EmailPage,
});

function EmailContent() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useBookingDraft();
  const [error, setError] = React.useState<string | null>(null);

  const handleNext = () => {
    const email = draft.contact.email || "";
    const valid = /.+@.+\..+/.test(email);
    if (!email.trim() || !valid) {
      setError("Please enter a valid email address");
      return;
    }
    bookingAnalytics.selectionMade("email", email);
    navigate({ to: "/booking-quiz/new/phone" });
  };

  return (
    <QuizIdentityLayout
      title="What's your email?"
      subtitle="We'll send booking updates, bespoke quotes, and your receipt here."
    >
      <div className="space-y-6">
        <div>
          <label className="text-sm font-bold text-[#163022] uppercase tracking-wider">Email Address</label>
          <input
            className={`${inputBase} mt-2 py-4 text-lg border-2 focus:border-[#163022] transition-colors`}
            type="email"
            value={draft.contact.email || ""}
            onChange={(e) => {
              updateDraft({ contact: { ...draft.contact, email: e.target.value } });
              setError(null);
            }}
            placeholder="you@example.com"
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
      </div>
    </QuizIdentityLayout>
  );
}

function EmailPage() {
  return <EmailContent />;
}

