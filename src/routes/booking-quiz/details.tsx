import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookingWizardProvider, useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { WizardLayout } from "~/components/bookings/wizard/WizardLayout";
import { SummaryPanel } from "~/components/bookings/wizard/SummaryPanel";
import { buttonPrimary, helperText, inputBase } from "~/components/bookings/wizard/styles";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";

export const Route = createFileRoute("/booking-quiz/details")({
  component: DetailsPage,
});

function DetailsContent() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useBookingDraft();
  const [errors, setErrors] = React.useState<{ name?: string; email?: string; phone?: string }>({});

  React.useEffect(() => {
    bookingAnalytics.stepViewed("your-details");
  }, []);

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!draft.contact.fullName?.trim()) nextErrors.name = "Full Name field is required";
    if (!draft.contact.email?.trim() || !/.+@.+\..+/.test(draft.contact.email)) nextErrors.email = "Valid email is required";
    if (!draft.contact.phone?.trim()) nextErrors.phone = "Phone number is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return (
    <WizardLayout step={3} summary={<SummaryPanel draft={draft} />}>
      <div>
        <h1 className="text-2xl font-semibold">Contact Information</h1>
        <p className={`${helperText} mt-2`}>We'll send confirmations and reminders here.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[#5c5a55]">Full Name</label>
          <input
            className={`${inputBase} mt-2`}
            value={draft.contact.fullName || ""}
            onChange={(e) => {
              updateDraft({ contact: { ...draft.contact, fullName: e.target.value } });
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
          />
          {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-[#5c5a55]">Email</label>
          <input
            className={`${inputBase} mt-2`}
            type="email"
            value={draft.contact.email || ""}
            onChange={(e) => {
              updateDraft({ contact: { ...draft.contact, email: e.target.value } });
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
          />
          {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-[#5c5a55]">Phone Number</label>
          <input
            className={`${inputBase} mt-2`}
            value={draft.contact.phone || ""}
            onChange={(e) => {
              updateDraft({ contact: { ...draft.contact, phone: e.target.value } });
              setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
          />
          {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone}</p>}
        </div>
      </div>
      <button
        type="button"
        className={`${buttonPrimary} mt-6 w-full md:w-auto`}
        onClick={() => {
          if (!validate()) return;
          navigate({ to: "/booking-quiz/address-details" });
        }}
      >
        Next &rarr;
      </button>
    </WizardLayout>
  );
}

function DetailsPage() {
  return <DetailsContent />;
}
