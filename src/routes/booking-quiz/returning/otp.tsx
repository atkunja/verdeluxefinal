import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";
import { buttonPrimary, helperText, inputBase } from "~/components/bookings/wizard/styles";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { QuizIdentityLayout } from "~/components/bookings/wizard/QuizIdentityLayout";

export const Route = createFileRoute("/booking-quiz/returning/otp")({
  component: ReturningOtpPage,
});

function ReturningOtpContent() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { draft } = useBookingDraft();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const verifyMutation = useMutation(trpc.booking.verifyQuizOtp.mutationOptions());

  const handleVerify = () => {
    if (!/^[0-9]{6}$/.test(code)) {
      setError("Please enter the 6-digit code we sent you");
      return;
    }
    verifyMutation.mutate(
      { phone: draft.contact.phone || "", code },
      {
        onSuccess: (data) => {
          bookingAnalytics.selectionMade("returning-otp", true);

          // If we got a token back, log the user in
          if (data.token && data.user) {
            setAuth(data.token, data.user);
            toast.success("Welcome back!");
            navigate({ to: "/client-portal" });
          } else {
            // OTP verified but no account found with this phone
            toast.error("No account found with this phone number. Please register first.");
            navigate({ to: "/booking-quiz/new/phone" });
          }
        },
        onError: (err) => toast.error(err.message || "Invalid code"),
      }
    );
  };

  return (
    < QuizIdentityLayout
      title="Verify Identity"
      subtitle={`Enter the 6-digit verification code sent to ${draft.contact.phone || ''}.`}
    >
      <div className="space-y-6">
        <div>
          <label className="text-sm font-bold text-[#163022] uppercase tracking-wider">Verification Code</label>
          <input
            className={`${inputBase} mt-2 py-4 text-center text-3xl tracking-[1em] font-mono border-2 focus:border-[#163022] transition-colors`}
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(val);
              setError(null);
            }}
            placeholder="000000"
            inputMode="numeric"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
          {error && <p className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </p>}
        </div>

        <button
          type="button"
          className={`${buttonPrimary} w-full py-4 text-lg shadow-xl active:scale-[0.98] disabled:opacity-70`}
          onClick={handleVerify}
          disabled={verifyMutation.isPending}
        >
          {verifyMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Verifying...
            </span>
          ) : "Sign In"}
        </button>

        <p className="text-center text-xs text-[#5c5a55]">
          Didn't receive the code? <button type="button" onClick={() => navigate({ to: "/booking-quiz/returning/phone" })} className="font-bold underline">Try again</button>
        </p>
      </div>
    </QuizIdentityLayout>
  );
}

function ReturningOtpPage() {
  return <ReturningOtpContent />;
}


