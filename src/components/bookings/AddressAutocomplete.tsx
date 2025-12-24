import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    google?: any;
  }
}

// Service area cities for Verde Luxe Cleaning
export const SERVICE_AREA_CITIES = [
  "Canton",
  "Dearborn",
  "Dearborn Heights",
  "Farmington",
  "Farmington Hills",
  "Garden City",
  "Livonia",
  "Northville",
  "Northville Township",
  "Novi",
  "Plymouth Township",
  "Romulus",
  "Southfield",
  "Van Buren Township",
  "Wayne",
  "Westland",
  "Ypsilanti",
  "Ypsilanti Township",
];

// Mocked address autocomplete for offline usage
const mockAddresses = [
  "123 Main Street, Canton, MI, USA",
  "456 Ford Road, Dearborn, MI, USA",
  "789 Telegraph Road, Dearborn Heights, MI, USA",
  "101 Grand River Ave, Farmington, MI, USA",
  "202 Orchard Lake Road, Farmington Hills, MI, USA",
  "303 Middlebelt Road, Garden City, MI, USA",
  "404 Plymouth Road, Livonia, MI, USA",
  "505 Center Street, Northville, MI, USA",
  "606 Beck Road, Northville Township, MI, USA",
  "707 Novi Road, Novi, MI, USA",
  "808 Ann Arbor Road, Plymouth Township, MI, USA",
  "909 Wayne Road, Romulus, MI, USA",
  "1010 Northwestern Hwy, Southfield, MI, USA",
  "1111 Belleville Road, Van Buren Township, MI, USA",
  "1212 Michigan Ave, Wayne, MI, USA",
  "1313 Ford Road, Westland, MI, USA",
  "1414 Washtenaw Ave, Ypsilanti, MI, USA",
  "1515 Whittaker Road, Ypsilanti Township, MI, USA",
];


interface AddressDetails {
  address: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  city?: string;
  state?: string;
  postalCode?: string;
  streetNumber?: string;
  route?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  onPlaceSelect?: (payload: AddressDetails) => void;
  placeholder?: string;
  enablePlaces?: boolean; // set true when VITE_GOOGLE_PLACES_KEY is configured
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  onPlaceSelect,
  placeholder = "Start typing your address...",
  enablePlaces,
}: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [placesReady, setPlacesReady] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const googleApiKey = import.meta.env.VITE_GOOGLE_PLACES_KEY as string | undefined;

  useEffect(() => {
    if (!enablePlaces || !googleApiKey) return;
    if (window.google?.maps?.places) {
      setPlacesReady(true);
      return;
    }
    const existing = document.getElementById("google-places-script");
    if (existing) {
      existing.addEventListener("load", () => setPlacesReady(true));
      return;
    }
    const script = document.createElement("script");
    script.id = "google-places-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
    script.async = true;
    script.onload = () => setPlacesReady(true);
    document.body.appendChild(script);
  }, [enablePlaces, googleApiKey]);

  useEffect(() => {
    if (!placesReady || !enablePlaces || !inputRef.current || !window.google?.maps?.places) return;
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "place_id", "geometry", "address_components"],
      componentRestrictions: { country: ["us"] },
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const address = place?.formatted_address || inputRef.current?.value || "";
      const lat = place?.geometry?.location?.lat?.();
      const lng = place?.geometry?.location?.lng?.();

      const components = place?.address_components ?? [];
      const getComponent = (type: string) =>
        components.find((c: any) => c.types?.includes(type))?.long_name;
      const getShortComponent = (type: string) =>
        components.find((c: any) => c.types?.includes(type))?.short_name;

      const city = getComponent("locality") || getComponent("postal_town") || getComponent("sublocality_level_1");
      const state = getShortComponent("administrative_area_level_1");
      const postalCode = getComponent("postal_code");
      const streetNumber = getComponent("street_number");
      const route = getComponent("route");

      onChange(address);
      onSelect?.(address);
      onPlaceSelect?.({
        address,
        placeId: place?.place_id,
        lat,
        lng,
        city,
        state,
        postalCode,
        streetNumber,
        route,
      });
      setOpen(false);
    });
    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [placesReady, enablePlaces, onChange, onSelect, onPlaceSelect]);

  const suggestions = useMemo(() => {
    // If Google Places is enabled and ready, we want to use its real results
    // instead of showing our fixed mock list.
    if (enablePlaces && placesReady) return [];

    if (!value || value.length < 1) return mockAddresses;
    return mockAddresses.filter((entry) =>
      entry.toLowerCase().includes(value.toLowerCase())
    );
  }, [value, enablePlaces, placesReady]);

  return (
    <div className="relative w-full">
      <label htmlFor="address-input" className="block text-sm font-medium text-gray-700">
        Address
      </label>
      <input
        id="address-input"
        type="text"
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay close to allow click on suggestions
          setTimeout(() => setOpen(false), 200);
        }}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#163022] focus:outline-none focus:ring-2 focus:ring-[#163022]"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
            Select a service area address
          </div>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()} // Prevent blur
              onClick={() => {
                onChange(s);
                onSelect?.(s);
                // Extract city from address for service area check
                const cityMatch = SERVICE_AREA_CITIES.find(city =>
                  s.toLowerCase().includes(city.toLowerCase())
                );
                onPlaceSelect?.({ address: s, city: cityMatch });
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              <span className="text-lg text-gray-500">📍</span>
              <span className="text-gray-800">{s}</span>
            </button>
          ))}
        </div>
      )}
      {open && value && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-dashed border-gray-200 bg-white px-3 py-2 text-sm text-gray-500">
          No matching addresses. Try entering a number and street in one of our service cities.
        </div>
      )}
    </div>
  );
}
