import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";
import { buttonPrimary, helperText, inputBase } from "~/components/bookings/wizard/styles";
import { useTRPC } from "~/trpc/react";
import { QuizIdentityLayout } from "~/components/bookings/wizard/QuizIdentityLayout";

export const Route = createFileRoute("/booking-quiz/returning/phone")({
  component: ReturningPhonePage,
});

function ReturningPhoneContent() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { draft, updateDraft } = useBookingDraft();
  const [error, setError] = React.useState<string | null>(null);
  const sendOtpMutation = useMutation(trpc.booking.sendQuizOtp.mutationOptions());

  const handleSendCode = () => {
    const phone = draft.contact.phone || "";
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }
    bookingAnalytics.selectionMade("returning-phone", phone);
    sendOtpMutation.mutate(
      { phone },
      {
        onSuccess: () => {
          toast.success("Verification code sent");
          navigate({ to: "/booking-quiz/returning/otp" });
        },
        onError: (err) => toast.error(err.message || "Failed to send code"),
      }
    );
  };

  return (
    <QuizIdentityLayout
      title="Welcome back"
      subtitle="Sign in with your phone number to manage your bespoke cleans."
    >
      <div className="space-y-6">
        <div>
          <label className="text-sm font-bold text-[#163022] uppercase tracking-wider">Phone Number</label>
          <input
            className={`${inputBase} mt-2 py-4 text-lg border-2 focus:border-[#163022] transition-colors`}
            value={draft.contact.phone || ""}
            onChange={(e) => {
              updateDraft({ contact: { ...draft.contact, phone: e.target.value } });
              setError(null);
            }}
            placeholder="(555) 123-4567"
            onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
            autoFocus
            inputMode="tel"
          />
          {error && <p className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </p>}
        </div>

        <button
          type="button"
          className={`${buttonPrimary} w-full py-4 text-lg shadow-xl active:scale-[0.98] disabled:opacity-70`}
          onClick={handleSendCode}
          disabled={sendOtpMutation.isPending}
        >
          {sendOtpMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Sending...
            </span>
          ) : "Continue to Sign In"}
        </button>

        <p className="text-center text-xs text-[#5c5a55]">
          New customer? <button type="button" onClick={() => navigate({ to: "/booking-quiz/new/full-name" })} className="font-bold underline">Start here</button>
        </p>
      </div>
    </QuizIdentityLayout>
  );
}

function ReturningPhonePage() {
  return <ReturningPhoneContent />;
}

