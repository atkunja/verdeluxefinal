import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AddressAutocomplete, SERVICE_AREA_CITIES } from "~/components/bookings/AddressAutocomplete";
import { BookingWizardProvider, useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { WizardLayout } from "~/components/bookings/wizard/WizardLayout";
import { SummaryPanel } from "~/components/bookings/wizard/SummaryPanel";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";
import { buttonPrimary, helperText } from "~/components/bookings/wizard/styles";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/booking-quiz/address")({
  component: AddressStepPage,
});

// Helper to check if address is in service area
function isInServiceArea(address: string, city?: string): boolean {
  // If we have a city from Google Places, check it directly
  if (city) {
    return SERVICE_AREA_CITIES.some(
      (c) => c.toLowerCase() === city.toLowerCase()
    );
  }
  // Otherwise check if address contains any service area city
  const lowerAddress = address.toLowerCase();
  return SERVICE_AREA_CITIES.some((c) =>
    lowerAddress.includes(c.toLowerCase())
  );
}

function AddressStepContent() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useBookingDraft();
  const [addressSelected, setAddressSelected] = React.useState(Boolean(draft.address.formatted));
  const [showErrors, setShowErrors] = React.useState(false);
  const hasPlacesKey = Boolean(import.meta.env.VITE_GOOGLE_PLACES_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  React.useEffect(() => {
    bookingAnalytics.stepViewed("get-started");
  }, []);

  const handleOnChange = React.useCallback((value: string) => {
    updateDraft({ address: { ...draft.address, formatted: value, city: undefined } });
    setAddressSelected(false);
  }, [updateDraft, draft.address]);

  const handleOnSelect = React.useCallback((value: string) => {
    updateDraft({ address: { ...draft.address, formatted: value } });
    setAddressSelected(true);
  }, [updateDraft, draft.address]);

  const handleOnPlaceSelect = React.useCallback((payload: any) => {
    updateDraft({
      address: {
        ...draft.address,
        formatted: payload.address,
        placeId: payload.placeId,
        lat: payload.lat,
        lng: payload.lng,
        street: payload.streetNumber && payload.route ? `${payload.streetNumber} ${payload.route}` : payload.route || payload.streetNumber,
        city: payload.city,
        state: payload.state,
        zip: payload.postalCode,
      },
    });
    setAddressSelected(true);
  }, [updateDraft, draft.address]);

  // Check service area
  const addressValue = draft.address.formatted || "";
  const cityValue = draft.address.city;

  // Only show warning if:
  // 1. They have selected an address (addressSelected is true)
  // 2. OR they have typed a fairly long address (> 15 chars) and haven't selected yet (as a hint)
  const shouldShowWarning = addressSelected || addressValue.length > 20;

  const inServiceArea = shouldShowWarning
    ? isInServiceArea(addressValue, cityValue)
    : true; // Hide warning while typing initial characters

  // Allow proceeding if: address is selected from autocomplete OR (no Places API and address is typed)
  const hasValidInput = addressSelected || (!hasPlacesKey && addressValue.length >= 5);
  const canProceed = hasValidInput && inServiceArea;

  return (
    <WizardLayout step={0} summary={<SummaryPanel draft={draft} />}>
      <div>
        <h1 className="text-2xl font-semibold">Welcome!</h1>
        <p className={`${helperText} mt-2`}>Please enter your address below.</p>
      </div>
      <AddressAutocomplete
        value={draft.address.formatted || ""}
        onChange={handleOnChange}
        onSelect={handleOnSelect}
        onPlaceSelect={handleOnPlaceSelect}
        enablePlaces={hasPlacesKey}
      />

      {/* Service area warning */}
      {addressValue.length >= 5 && !inServiceArea && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">We don't currently service this area</p>
            <p className="text-sm mt-1">
              We currently provide cleaning services in: {SERVICE_AREA_CITIES.slice(0, 5).join(", ")}... and more cities in the Metro Detroit area.
            </p>
          </div>
        </div>
      )}

      {!hasValidInput && draft.address.formatted && hasPlacesKey && showErrors && (
        <p className="text-sm text-red-600">Please pick an address from suggestions.</p>
      )}

      <button
        type="button"
        className={`${buttonPrimary} mt-6 w-full md:w-auto`}
        onClick={() => {
          if (!canProceed) {
            setShowErrors(true);
            return;
          }
          bookingAnalytics.selectionMade("address", draft.address.formatted);
          navigate({ to: "/booking-quiz/clean/type" });
        }}
        disabled={false} // Don't disable, let the error show on click
      >
        Get Started &rarr;
      </button>
    </WizardLayout>
  );
}

function AddressStepPage() {
  return <AddressStepContent />;
}
