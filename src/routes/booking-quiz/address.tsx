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
      (c) => city.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(city.toLowerCase())
    );
  }
  // Otherwise check if address contains any service area city
  const lowerAddress = address.toLowerCase();
  return SERVICE_AREA_CITIES.some((c) =>
    lowerAddress.includes(c.toLowerCase())
  );
}

function MapPreview({ lat, lng }: { lat?: number; lng?: number }) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<any>(null);

  React.useEffect(() => {
    if (!mapRef.current || !window.google || !lat || !lng) return;

    if (!map) {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 15,
        disableDefaultUI: true,
        styles: [
          {
            featureType: "all",
            elementType: "geometry",
            stylers: [{ color: "#f5f5f5" }],
          },
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#616161" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#e9e9e9" }]
          }
        ],
      });
      new window.google.maps.Marker({
        position: { lat, lng },
        map: newMap,
      });
      setMap(newMap);
    } else {
      map.setCenter({ lat, lng });
    }
  }, [lat, lng, map]);

  if (!lat || !lng) return null;

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div ref={mapRef} className="h-48 w-full bg-gray-50" />
    </div>
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
    updateDraft({
      address: {
        ...draft.address,
        formatted: value,
        city: undefined,
        lat: undefined,
        lng: undefined
      }
    });
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
  const shouldShowWarning = addressSelected || addressValue.length > 40;

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
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">We don't currently service this area</p>
            <p className="text-sm mt-1">
              We currently provide cleaning services in: {SERVICE_AREA_CITIES.slice(0, 5).join(", ")}... and more cities in the Metro Detroit area.
            </p>
          </div>
        </div>
      )}

      {/* Map Preview */}
      <MapPreview lat={draft.address.lat} lng={draft.address.lng} />

      {!hasValidInput && draft.address.formatted && hasPlacesKey && showErrors && (
        <p className="mt-2 text-sm text-red-600">Please pick an address from suggestions.</p>
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
