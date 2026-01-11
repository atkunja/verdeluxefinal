import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";

import { useAuthStore } from "~/stores/authStore";
import React from "react";
import { QuizIdentityLayout } from "~/components/bookings/wizard/QuizIdentityLayout";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { ArrowRight, User } from "lucide-react";

const startSearchSchema = z.object({
  intent: z.string().optional(),
});

export const Route = createFileRoute("/booking-quiz/start")({
  component: StartChoicePage,
  validateSearch: zodValidator(startSearchSchema),
});

function StartChoiceContent() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { resetDraft, updateDraft, draft } = useBookingDraft();
  const { intent } = Route.useSearch();

  React.useEffect(() => {
    if (user) {
      updateDraft({
        contact: {
          ...draft.contact,
          fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          email: user.email,
          phone: user.phone || undefined,
        }
      });

      if (intent !== "choose") {
        console.log("[Start] Auto-navigating logged in user to address...");
        navigate({ to: "/booking-quiz/address" });
      }
    }
  }, [user, updateDraft, intent, navigate]);

  return (
    <QuizIdentityLayout
      title="Welcome to LuxeClean"
      subtitle="Choose how you'd like to start your premium cleaning experience."
    >
      <div className="grid gap-5">
        {/* New Customer Card */}
        <div className="group rounded-2xl bg-white/5 border border-white/10 p-6 transition-all duration-300 hover:bg-white/10 hover:border-emerald-400/30">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white">I'm a new customer</h2>
              <p className="mt-2 text-sm text-white/60">Answer a few quick questions to build your bespoke clean.</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
          <button
            type="button"
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-emerald-900/30 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
            onClick={() => {
              resetDraft();
              bookingAnalytics.stepViewed("start-new");
              navigate({ to: "/booking-quiz/new/full-name" });
            }}
          >
            Start New Booking
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Returning Customer Card */}
        <div className="group rounded-2xl bg-white/5 border border-white/10 p-6 transition-all duration-300 hover:bg-white/10 hover:border-emerald-400/30">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white">I've been here before</h2>
              <p className="mt-2 text-sm text-white/60">Sign in to quickly rebook or manage your cleans.</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <User className="h-5 w-5" />
            </div>
          </div>
          <button
            type="button"
            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-xl border border-white/20 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
            onClick={() => {
              resetDraft();
              bookingAnalytics.stepViewed("start-returning");
              navigate({ to: "/booking-quiz/returning/phone" });
            }}
          >
            Sign In with Phone
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>
    </QuizIdentityLayout>
  );
}

function StartChoicePage() {
  return <StartChoiceContent />;
}
