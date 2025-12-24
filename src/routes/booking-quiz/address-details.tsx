import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookingWizardProvider, useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { WizardLayout } from "~/components/bookings/wizard/WizardLayout";
import { SummaryPanel } from "~/components/bookings/wizard/SummaryPanel";
import { YesNoToggle } from "~/components/bookings/wizard/controls";
import { buttonPrimary, buttonSecondary, helperText, inputBase } from "~/components/bookings/wizard/styles";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";

export const Route = createFileRoute("/booking-quiz/address-details")({
  component: AddressDetailsPage,
});

function AddressDetailsContent() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useBookingDraft();
  const [errors, setErrors] = React.useState<{ residence?: string; parking?: string; terms?: string }>({});

  React.useEffect(() => {
    bookingAnalytics.stepViewed("your-address");
  }, []);

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!draft.logistics.residenceType) nextErrors.residence = "Residence type is required";
    if (!draft.logistics.parkingType) nextErrors.parking = "Parking selection is required";
    if (!draft.logistics.acceptedTerms) nextErrors.terms = "Terms must be accepted";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return (
    <WizardLayout step={4} summary={<SummaryPanel draft={draft} />}>
      <div>
        <h1 className="text-2xl font-semibold">Your Address</h1>
        <p className={`${helperText} mt-2`}>Confirm access, parking, and instructions.</p>
        <div className="mt-2 text-sm text-[#163022]">
          {draft.address.formatted}
          <button
            type="button"
            className="ml-2 text-xs underline"
            onClick={() => navigate({ to: "/booking-quiz/address" })}
          >
            Edit
          </button>
        </div>
      </div>

      <YesNoToggle
        label="Will you be at home for this appointment?"
        value={draft.logistics.homeDuringAppt}
        onChange={(value) => updateDraft({ logistics: { ...draft.logistics, homeDuringAppt: value } })}
      />

      <div>
        <p className="text-sm font-semibold text-[#163022]">You live in a:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { id: "house", label: "House" },
            { id: "townhouse", label: "Townhouse/Condo" },
            { id: "apartment", label: "Apartment" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${buttonSecondary} ${draft.logistics.residenceType === item.id ? "bg-[#163022] text-white" : ""}`}
              onClick={() => updateDraft({ logistics: { ...draft.logistics, residenceType: item.id as any } })}
              aria-pressed={draft.logistics.residenceType === item.id}
            >
              {item.label}
            </button>
          ))}
        </div>
        {errors.residence && <p className="mt-2 text-sm text-red-600">{errors.residence}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-[#5c5a55]">I have an access code (optional)</label>
        <input
          className={`${inputBase} mt-2`}
          value={draft.logistics.accessCode || ""}
          onChange={(e) => updateDraft({ logistics: { ...draft.logistics, accessCode: e.target.value } })}
          placeholder="Access code"
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-[#163022]">Where can we park?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { id: "street", label: "Street" },
            { id: "driveway", label: "Driveway" },
            { id: "garage", label: "Garage" },
            { id: "lot", label: "Parking Lot" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${buttonSecondary} ${draft.logistics.parkingType === item.id ? "bg-[#163022] text-white" : ""}`}
              onClick={() => updateDraft({ logistics: { ...draft.logistics, parkingType: item.id as any } })}
              aria-pressed={draft.logistics.parkingType === item.id}
            >
              {item.label}
            </button>
          ))}
        </div>
        {errors.parking && <p className="mt-2 text-sm text-red-600">{errors.parking}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-[#5c5a55]">Do you have parking, entry or exit instructions?</label>
        <textarea
          className={`${inputBase} mt-2 h-24`}
          value={draft.logistics.entryInstructions || ""}
          onChange={(e) => updateDraft({ logistics: { ...draft.logistics, entryInstructions: e.target.value } })}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-[#5c5a55]">Do you have specific cleaning instructions?</label>
        <textarea
          className={`${inputBase} mt-2 h-24`}
          value={draft.logistics.cleaningInstructions || ""}
          onChange={(e) => updateDraft({ logistics: { ...draft.logistics, cleaningInstructions: e.target.value } })}
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-[#2b312c]">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-gray-300 text-[#163022] focus:ring-[#163022]"
          checked={draft.logistics.acceptedTerms}
          onChange={(e) => updateDraft({ logistics: { ...draft.logistics, acceptedTerms: e.target.checked } })}
        />
        <span>I agree to the full Terms and Conditions</span>
      </label>
      {errors.terms && <p className="text-sm text-red-600">{errors.terms}</p>}

      <button
        type="button"
        className={`${buttonPrimary} mt-2 w-full md:w-auto`}
        onClick={() => {
          if (!validate()) return;
          navigate({ to: "/booking-quiz/payment" });
        }}
      >
        CONFIRM & PAY &rarr;
      </button>
    </WizardLayout>
  );
}

function AddressDetailsPage() {
  return <AddressDetailsContent />;
}
