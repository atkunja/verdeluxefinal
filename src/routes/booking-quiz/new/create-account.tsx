import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";

import { QuizIdentityLayout } from "~/components/bookings/wizard/QuizIdentityLayout";

export const Route = createFileRoute("/booking-quiz/new/create-account")({
  component: CreateAccountPage,
});

function CreateAccountContent() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { draft } = useBookingDraft();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [status, setStatus] = React.useState("Setting up your account...");
  const registerMutation = useMutation(trpc.register.mutationOptions());
  const loginMutation = useMutation(trpc.login.mutationOptions());
  const hasStarted = React.useRef(false);

  const tempPassword = import.meta.env.VITE_BOOKING_TEMP_PASSWORD as string | undefined;

  React.useEffect(() => {
    // Prevent double-execution in StrictMode
    if (hasStarted.current) return;
    hasStarted.current = true;

    const email = draft.contact.email;
    console.log("[CreateAccount] Starting automated registration for:", email);
    if (!email || !tempPassword) {
      console.error("[CreateAccount] Missing required data:", { email: !!email, tempPassword: !!tempPassword });
      toast.error("Missing email or configuration. Please restart.");
      navigate({ to: "/booking-quiz/start" });
      return;
    }

    bookingAnalytics.selectionMade("create-account", email);

    // Try to register
    registerMutation.mutate(
      {
        email,
        password: tempPassword,
        role: "CLIENT",
        firstName: draft.contact.fullName?.split(" ")[0],
        lastName: draft.contact.fullName?.split(" ").slice(1).join(" ") || undefined,
        phone: draft.contact.phone,
      },
      {
        onSuccess: (data) => {
          setAuth(data.token, data.user);
          toast.success("Account created!");
          navigate({ to: "/booking-quiz/address" });
        },
        onError: (err) => {
          console.log("[CreateAccount] Register failed, checking for existing account:", err.message);
          // If email already registered (either via CONFLICT or INTERNAL_SERVER_ERROR from Supabase)
          const msg = err.message?.toLowerCase() || "";
          if (msg.includes("already registered") || msg.includes("email_exists") || msg.includes("conflict")) {
            console.log("[CreateAccount] Detected existing account, attempting login with temp password...");
            setStatus("Logging you in...");
            loginMutation.mutate(
              { email, password: tempPassword },
              {
                onSuccess: (data) => {
                  console.log("[CreateAccount] Login successful!");
                  setAuth(data.token, data.user);
                  toast.success("Welcome back!");
                  navigate({ to: "/booking-quiz/address" });
                },
                onError: (loginErr) => {
                  console.error("[CreateAccount] Login failed:", loginErr.message);
                  toast.error("Account exists but login failed. Please try the 'Returning Customer' flow.");
                  navigate({ to: "/booking-quiz/returning/phone" });
                },
              }
            );
          } else {
            toast.error(err.message || "Failed to create account");
            navigate({ to: "/booking-quiz/start" });
          }
        },
      }
    );
  }, []);

  return (
    <QuizIdentityLayout
      title="Almost there..."
      subtitle="We're creating your premium profile and curating your bespoke clean."
    >
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-[#163022]/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#163022] rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold mt-8 text-[#163022]">{status}</h2>
        <p className="mt-2 text-sm text-[#5c5a55]">Initializing your Verde Luxe experience...</p>
      </div>
    </QuizIdentityLayout>
  );
}


function CreateAccountPage() {
  return <CreateAccountContent />;
}


