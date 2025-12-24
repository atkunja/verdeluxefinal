import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";

import { useAuthStore } from "~/stores/authStore";
import React from "react";
import { QuizIdentityLayout } from "~/components/bookings/wizard/QuizIdentityLayout";

const cardBase = "rounded-2xl border border-[#e3ded2] bg-white p-6 shadow-[0_14px_30px_rgba(22,48,34,0.08)]";
const buttonPrimary =
  "rounded-xl bg-[#163022] text-white px-6 py-3 font-semibold transition hover:translate-y-[-1px] hover:shadow-lg hover:shadow-[#163022]/20";

export const Route = createFileRoute("/booking-quiz/start")({
  component: StartChoicePage,
});

function StartChoiceContent() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { resetDraft, updateDraft, draft } = useBookingDraft();

  React.useEffect(() => {
    // If user is already logged in, auto-start a new booking for them
    if (user) {
      const userEmail = user.email;
      const draftEmail = draft.contact.email;

      // If draft is already synced with user email, proceed to booking flow
      if (draftEmail === userEmail) {
        console.log("[Start] User already synced, going to address page...");
        navigate({ to: "/booking-quiz/address" });
        return;
      }

      console.log("[Start] Syncing draft with user details...");
      // Update draft with user details and wait for next render cycle
      updateDraft({
        contact: {
          ...draft.contact,
          fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          email: user.email,
          phone: user.phone || undefined,
        }
      });
      // After update, the effect will run again and the email check will pass
    }
  }, [user, draft.contact.email, navigate, updateDraft, draft.contact]);

  return (
    <QuizIdentityLayout
      title="Welcome to Verde Luxe"
      subtitle="Choose how you'd like to start your premium cleaning experience."
    >
      <div className="grid gap-6">
        <div className={`${cardBase} group transition-all duration-300 hover:border-[#163022]/30 hover:bg-[#fcfbf9]`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#163022]">I'm a new customer</h2>
              <p className="mt-2 text-sm text-[#5c5a55]">Answer a few quick questions to build your bespoke clean.</p>
            </div>
            <div className="bg-[#f5f1e8] p-3 rounded-full text-[#163022] group-hover:bg-[#163022] group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </div>
          </div>
          <button
            type="button"
            className={`${buttonPrimary} mt-6 w-full py-4 shadow-md active:scale-95`}
            onClick={() => {
              resetDraft();
              bookingAnalytics.stepViewed("start-new");
              navigate({ to: "/booking-quiz/new/full-name" });
            }}
          >
            Start New Booking
          </button>
        </div>

        <div className={`${cardBase} group transition-all duration-300 hover:border-[#163022]/30 hover:bg-[#fcfbf9]`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#163022]">I've been here before</h2>
              <p className="mt-2 text-sm text-[#5c5a55]">Sign in to quickly rebook or manage your cleans.</p>
            </div>
            <div className="bg-[#f5f1e8] p-3 rounded-full text-[#163022] group-hover:bg-[#163022] group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
          </div>
          <button
            type="button"
            className={`${buttonPrimary} mt-6 w-full py-4 shadow-md active:scale-95`}
            onClick={() => {
              resetDraft();
              bookingAnalytics.stepViewed("start-returning");
              navigate({ to: "/booking-quiz/returning/phone" });
            }}
          >
            Sign In with Phone
          </button>
        </div>
      </div>
    </QuizIdentityLayout>
  );
}

function StartChoicePage() {
  return <StartChoiceContent />;
}
