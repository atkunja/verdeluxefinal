import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Trash2, Calculator, User, Calendar, Home, Package, DollarSign, CreditCard, MapPin, FileText, Users, Building2, AlertTriangle, CheckCircle, XCircle, CalendarOff, Shield, ChevronDown } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/authStore";
import { BookingCalendarPicker } from "~/components/BookingCalendarPicker";
import { formatDurationHours } from "~/utils/formatTime";
import { AddressAutocomplete } from "~/components/bookings/AddressAutocomplete";
import { ClientSelector, ClientOption } from "~/components/bookings/ClientSelector";

const bookingSchema = z.object({
  clientId: z.number().optional(),
  clientEmail: z.string().email("Invalid email address").optional(),
  clientFirstName: z.string().optional(),
  clientLastName: z.string().optional(),
  clientPhone: z.string().optional(),
  cleanerId: z.number().nullable().optional(),
  cleanerIds: z.array(z.number()).max(2).optional(),
  serviceType: z.string().min(1, "Service type is required"),
  scheduledDate: z.string().min(1, "Date is required"),
  scheduledTime: z.string().min(1, "Time is required"),
  durationHours: z.number().positive().optional(),
  address: z.string().min(1, "Address is required"),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  placeId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  apartment: z.string().optional(),
  specialInstructions: z.string().optional(),
  privateBookingNote: z.string().optional(),
  privateCustomerNote: z.string().optional(),
  providerNote: z.string().optional(),
  finalPrice: z.number().nonnegative().optional(),
  serviceFrequency: z.enum(["ONE_TIME", "WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
  houseSquareFootage: z.number().int().nonnegative().optional(),
  basementSquareFootage: z.number().int().nonnegative().optional(),
  numberOfBedrooms: z.number().int().nonnegative().optional(),
  numberOfBathrooms: z.number().int().nonnegative().optional(),
  numberOfCleanersRequested: z.number().int().nonnegative().optional(),
  cleanerPaymentAmount: z.number().positive().optional(),
  paymentMethod: z
    .enum(["CREDIT_CARD", "CASH", "ZELLE", "VENMO", "OTHER"])
    .optional(),
  paymentDetails: z.string().optional(),
  selectedExtras: z.array(z.number()).optional(), // Array of extra service rule IDs
  overrideConflict: z.boolean().optional(),
  leadId: z.number().optional(),
}).refine((data) => data.clientId || data.clientEmail, {
  message: "Either select an existing client or provide email for new client",
  path: ["clientId"],
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface User {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone?: string | null;
}

interface Booking {
  id: number;
  clientId: number;
  cleanerId: number | null;
  cleanerIds?: number[] | null;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number | null;
  address: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  specialInstructions: string | null;
  privateBookingNote?: string | null;
  privateCustomerNote?: string | null;
  providerNote?: string | null;
  finalPrice: number | null;
  serviceFrequency: string | null;
  houseSquareFootage: number | null;
  basementSquareFootage: number | null;
  numberOfBedrooms: number | null;
  numberOfBathrooms: number | null;
  numberOfCleanersRequested: number | null;
  cleanerPaymentAmount: number | null;
  paymentMethod: string | null;
  paymentDetails: string | null;
  apartment?: string | null;
  selectedExtras?: number[] | null;
}

type CleanerWithAvailability = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  isAvailable: boolean;
  conflictType?: string | null;
  conflictDetails?: string | null;
};

interface AdminBookingFormProps {
  clients: User[];
  cleaners: User[];
  booking?: Booking;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  onDelete?: (bookingId: number, clientName: string) => void;
  isSubmitting: boolean;
  isDeleting?: boolean;
  initialData?: Partial<BookingFormData>;
}

export function AdminBookingForm({
  clients,
  cleaners,
  booking,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting,
  isDeleting,
  initialData,
}: AdminBookingFormProps) {
  const trpc = useTRPC();
  const { token } = useAuthStore();
  const googlePlacesKey = String(import.meta.env.VITE_GOOGLE_PLACES_KEY || "");
  const [isNewClient, setIsNewClient] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<number[]>(
    booking?.selectedExtras ?? []
  );
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [overrideConflict, setOverrideConflict] = useState(false);
  const [placesPredictions, setPlacesPredictions] = useState<{ description: string; placeId?: string }[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const clientOptions: ClientOption[] = clients.map((c) => ({
    id: c.id,
    name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email,
    email: c.email,
    phone: c.phone,
    lastAddress: null,
  }));

  // Auto-switch to "New Client" if initialData provides new client info (email but no ID)
  // Update form values when initialData loads (e.g. from lead conversion)
  useEffect(() => {
    if (initialData?.clientEmail && !initialData.clientId) {
      setIsNewClient(true);
    }
  }, [initialData]);

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    watch,
    setValue,
    control,
    reset,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: booking
      ? {
        clientId: booking.clientId,
        cleanerId: booking.cleanerId,
        cleanerIds: booking.cleanerIds ?? (booking.cleanerId ? [booking.cleanerId] : []),
        serviceType: booking.serviceType,
        scheduledDate: new Date(booking.scheduledDate).toISOString().split("T")[0],
        scheduledTime: booking.scheduledTime,
        durationHours: booking.durationHours || undefined,
        address: booking.address,
        addressLine1: booking.addressLine1 ?? booking.address,
        addressLine2: booking.addressLine2 ?? "",
        city: booking.city ?? "",
        state: booking.state ?? "",
        postalCode: booking.postalCode ?? "",
        placeId: booking.placeId ?? "",
        latitude: booking.latitude ?? undefined,
        longitude: booking.longitude ?? undefined,
        apartment: booking.apartment ?? "",
        specialInstructions: booking.specialInstructions || "",
        privateBookingNote: booking.privateBookingNote || "",
        privateCustomerNote: booking.privateCustomerNote || "",
        providerNote: booking.providerNote || "",
        finalPrice: booking.finalPrice || undefined,
        serviceFrequency:
          booking.serviceFrequency === "ONE_TIME" ||
            booking.serviceFrequency === "WEEKLY" ||
            booking.serviceFrequency === "BIWEEKLY" ||
            booking.serviceFrequency === "MONTHLY"
            ? booking.serviceFrequency
            : undefined,
        houseSquareFootage: booking.houseSquareFootage || undefined,
        basementSquareFootage: booking.basementSquareFootage || undefined,
        numberOfBedrooms: booking.numberOfBedrooms || undefined,
        numberOfBathrooms: booking.numberOfBathrooms || undefined,
        numberOfCleanersRequested: booking.numberOfCleanersRequested || undefined,
        cleanerPaymentAmount: booking.cleanerPaymentAmount || undefined,
        paymentMethod:
          booking.paymentMethod === "CREDIT_CARD" ||
            booking.paymentMethod === "CASH" ||
            booking.paymentMethod === "ZELLE" ||
            booking.paymentMethod === "VENMO" ||
            booking.paymentMethod === "OTHER"
            ? booking.paymentMethod
            : undefined,
        paymentDetails: booking.paymentDetails || "",
        selectedExtras: booking.selectedExtras ?? [],
      }
      : initialData
        ? {
          ...initialData,
          cleanerIds: [],
          selectedExtras: [],
        }
        : undefined,
  });

  // Update form values when initialData loads (e.g. from lead conversion)
  useEffect(() => {
    if (initialData && !booking) {
      reset({
        ...initialData,
        cleanerIds: [],
        selectedExtras: [],
      });
    }
  }, [initialData, booking, reset]);

  // Fetch pricing rules to get available extras
  const pricingRulesQuery = useQuery(
    trpc.getPricingRules.queryOptions(undefined, {
      enabled: !!token,
    })
  );

  const extraServices = (pricingRulesQuery.data?.pricingRules || []).filter(
    (rule) => rule.ruleType === "EXTRA_SERVICE" && rule.isActive
  );

  // Watch form fields for automatic price calculation
  const serviceType = watch("serviceType");
  const houseSquareFootage = watch("houseSquareFootage");
  const basementSquareFootage = watch("basementSquareFootage");
  const numberOfBedrooms = watch("numberOfBedrooms");
  const numberOfBathrooms = watch("numberOfBathrooms");
  const selectedCleanerId = watch("cleanerId");
  const selectedClientId = watch("clientId");
  const finalPriceValue = watch("finalPrice");

  // Watch form fields for cleaner availability check
  const scheduledDate = watch("scheduledDate");
  const scheduledTime = watch("scheduledTime");
  const durationHours = watch("durationHours");
  const numberOfCleanersRequested = watch("numberOfCleanersRequested");
  const addressValue = watch("address");
  const placeIdValue = watch("placeId");
  const paymentMethodsQuery = useQuery(
    (selectedClientId
      ? trpc.getCustomerPaymentMethods.queryOptions({ customerId: Number(selectedClientId) })
      : {
        queryKey: ["getCustomerPaymentMethods", "empty"],
        queryFn: async () => ({ paymentMethods: [] }),
        enabled: false,
      }) as any
  );

  // Stub cleaner availability query (real availability handled server-side)
  const cleanerAvailabilityQuery = useQuery<{ cleaners: CleanerWithAvailability[] }>({
    queryKey: [
      "cleanerAvailability",
      scheduledDate,
      scheduledTime,
      durationHours,
      booking?.id,
    ],
    queryFn: async () => ({ cleaners: [] }),
    enabled: false,
  });

  const cleanersWithAvailability =
    cleanerAvailabilityQuery.data?.cleaners ?? [];

  // Find the selected cleaner's availability status
  const selectedCleaner = cleanersWithAvailability.find(
    (c) => c.id === selectedCleanerId
  );
  const isSelectedCleanerUnavailable =
    selectedCleaner && !selectedCleaner.isAvailable;
  const selectedCleanerIds = watch("cleanerIds") || [];

  // Calculate price whenever relevant fields change
  const priceCalculationQuery = useQuery(
    trpc.calculateBookingPrice.queryOptions(
      {
        serviceType: serviceType || "",
        houseSquareFootage: houseSquareFootage || undefined,
        basementSquareFootage: basementSquareFootage || undefined,
        numberOfBedrooms: numberOfBedrooms || undefined,
        numberOfBathrooms: numberOfBathrooms || undefined,
        selectedExtras,
      },
      {
        enabled: !!token && !!serviceType,
      }
    )
  );

  // Update form values when calculation completes
  useEffect(() => {
    if (priceCalculationQuery.data) {
      setValue("finalPrice", priceCalculationQuery.data.price);
      setValue("durationHours", priceCalculationQuery.data.durationHours || undefined);
    }
  }, [priceCalculationQuery.data, setValue]);

  // Reset override when cleaner changes
  useEffect(() => {
    if (selectedCleaner?.isAvailable) {
      setOverrideConflict(false);
    }
  }, [selectedCleanerId, selectedCleaner?.isAvailable]);

  // Google Places autocomplete (lightweight fetch)
  useEffect(() => {
    if (!googlePlacesKey || !addressValue || addressValue.length < 3) {
      setPlacesPredictions([]);
      return;
    }
    const controller = new AbortController();
    type PlacesPrediction = { description: string; place_id?: string };
    type PlacesResponse = { predictions?: PlacesPrediction[] };
    const fetchPlaces = async (query: string) => {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            query
          )}&key=${googlePlacesKey}&types=address`,
          { signal: controller.signal }
        );
        const data = (await res.json()) as PlacesResponse;
        setPlacesPredictions(
          (data?.predictions || []).map((prediction) => ({
            description: prediction.description,
            placeId: prediction.place_id,
          }))
        );
      } catch (err) {
        setPlacesPredictions([]);
      }
    };
    const timeoutId = window.setTimeout(() => {
      void fetchPlaces(addressValue);
    }, 250);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [addressValue, googlePlacesKey]);

  const fetchPlaceDetails = async (placeId: string) => {
    if (!googlePlacesKey || !placeId) return;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
          placeId
        )}&fields=address_component,geometry&key=${googlePlacesKey}`
      );
      const data = await res.json();
      const components = data?.result?.address_components ?? [];
      const getComponent = (type: string) =>
        components.find((c: any) => c.types?.includes(type))?.long_name;
      const streetNumber = getComponent("street_number");
      const route = getComponent("route");
      const line1 = [streetNumber, route].filter(Boolean).join(" ");
      const city = getComponent("locality") || getComponent("postal_town");
      const state = components.find((c: any) => c.types?.includes("administrative_area_level_1"))?.short_name;
      const postalCode = getComponent("postal_code");
      const lat = data?.result?.geometry?.location?.lat;
      const lng = data?.result?.geometry?.location?.lng;

      if (line1) {
        setValue("address", line1);
        setValue("addressLine1", line1);
      }
      if (city) setValue("city", city);
      if (state) setValue("state", state);
      if (postalCode) setValue("postalCode", postalCode);
      if (typeof lat === "number") setValue("latitude", lat);
      if (typeof lng === "number") setValue("longitude", lng);
    } catch (err) {
      // ignore details lookup errors
    }
  };

  // Handler for toggling extras
  const handleToggleExtra = (extraId: number) => {
    setSelectedExtras((prev) => {
      if (prev.includes(extraId)) {
        return prev.filter((id) => id !== extraId);
      } else {
        return [...prev, extraId];
      }
    });
  };

  // Update form value when selectedExtras changes
  useEffect(() => {
    setValue("selectedExtras", selectedExtras);
  }, [selectedExtras, setValue]);

  const serviceTypes = [
    "Standard Home Cleaning",
    "Deep Home Cleaning",
    "Vacation Rental Cleaning",
    "Commercial Cleaning",
    "Move-In/Out Cleaning",
    "Post Construction Cleaning",
  ];

  const searchClientsQuery = useQuery(
    trpc.getAllUsersAdmin.queryOptions(
      { role: "CLIENT", search: clientSearch || undefined },
      { enabled: !!token && clientSearch.length > 1, staleTime: 10_000 }
    )
  );

  const dynamicClientOptions = (searchClientsQuery.data?.users as User[] | undefined) ?? clients;
  const filteredClientOptions =
    clientSearch.length > 0
      ? dynamicClientOptions.filter((c) =>
        `${c.firstName ?? ""} ${c.lastName ?? ""} ${c.email}`
          .toLowerCase()
          .includes(clientSearch.toLowerCase())
      )
      : dynamicClientOptions.map((c) => ({
        id: c.id,
        name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email,
        email: c.email,
        phone: c.phone,
        lastAddress: null,
      }));

  const latestClientBookingQuery = useQuery(
    trpc.getLatestBookingForClient.queryOptions(
      { clientId: Number(selectedClientId) },
      { enabled: !!token && !!selectedClientId }
    )
  );

  useEffect(() => {
    if (booking || !latestClientBookingQuery.data?.booking) return;
    const touched =
      dirtyFields.address ||
      dirtyFields.addressLine1 ||
      dirtyFields.addressLine2 ||
      dirtyFields.city ||
      dirtyFields.state ||
      dirtyFields.postalCode ||
      dirtyFields.apartment;
    if (touched) return;
    const latest = latestClientBookingQuery.data.booking;
    if (latest.addressLine1 || latest.address) {
      setValue("address", latest.addressLine1 ?? latest.address ?? "");
      setValue("addressLine1", latest.addressLine1 ?? latest.address ?? "");
      setValue("addressLine2", latest.addressLine2 ?? "");
      setValue("city", latest.city ?? "");
      setValue("state", latest.state ?? "");
      setValue("postalCode", latest.postalCode ?? "");
      setValue("placeId", latest.placeId ?? "");
      setValue("latitude", latest.latitude ?? undefined);
      setValue("longitude", latest.longitude ?? undefined);
    }
  }, [booking, dirtyFields, latestClientBookingQuery.data, setValue]);

  const handleCleanerMultiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
    const limited = selected.slice(0, 2); // cap at 2 cleaners
    setValue("cleanerIds", limited, { shouldValidate: true });
    if (limited.length === 2 && watch("durationHours")) {
      const halved = Math.max(0.5, (watch("durationHours") || 0) / 2);
      setValue("durationHours", halved);
    }
  };

  const conflictsQuery = useQuery(
    trpc.getAvailabilityConflicts.queryOptions(
      {
        scheduledDate: scheduledDate || "",
        scheduledTime: scheduledTime || "",
        cleanerIds: selectedCleanerIds.filter(Boolean),
        ignoreBookingId: booking?.id,
      },
      { enabled: !!scheduledDate && !!scheduledTime && selectedCleanerIds.length > 0 }
    )
  );

  const onSubmitForm = (data: BookingFormData) => {
    const composedAddress = data.apartment
      ? `${data.address}, Apt ${data.apartment}`
      : data.address;
    onSubmit({
      ...data,
      address: composedAddress,
      addressLine1: data.address,
      addressLine2: data.apartment || "",
      placeId: placeIdValue || data.placeId || "",
      city: data.city || undefined,
      state: data.state || undefined,
      postalCode: data.postalCode || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      overrideConflict,
      _shouldAdjustHold: booking ? data.finalPrice !== booking.finalPrice : false,
    } as any);
  };

  return (
    <div className="bg-white flex flex-col h-full w-full overflow-hidden">
      {/* Sticky Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-5 flex-shrink-0 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              {booking ? "Edit Booking" : "Create New Booking"}
            </h2>
            <p className="text-green-100 text-sm">
              {booking ? `Booking #${booking.id}` : "Fill in the details below"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <form
        onSubmit={(event) => void handleSubmit(onSubmitForm)(event)}
        className="flex-1 overflow-y-auto scroll-pb-24"
      >
        <div className="p-6 space-y-6">
          <div className="bg-[#f7f4ed] border border-[#d7d1c4] text-xs text-[#163022] rounded-lg px-3 py-2">
            Required: client + address + service type + date/time. Payment and extras are optional.
          </div>
          {/* Client Selection Mode Toggle */}
          {!booking && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Client Selection</h3>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewClient(false)}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${!isNewClient
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                    }`}
                >
                  Select Existing Client
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewClient(true)}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${isNewClient
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                    }`}
                >
                  Create New Client
                </button>
              </div>
            </div>
          )}

          {/* Client Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Client Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isNewClient ? (
                <div className="md:col-span-2 space-y-2">
                  <ClientSelector
                    options={clientOptions}
                    onSelect={(client) => {
                      setValue("clientId", client.id);
                      setValue("clientEmail", client.email);
                      setValue("clientFirstName", client.name.split(" ")[0] || "");
                      setValue("clientLastName", client.name.split(" ").slice(1).join(" "));
                      if (client.lastAddress) {
                        setValue("address", client.lastAddress);
                      }
                      setIsNewClient(false);
                    }}
                  />
                  <p className="text-xs text-gray-500">Selecting a client will prefill contact and address when available.</p>
                  {errors.clientId && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <span className="text-red-500">•</span> {errors.clientId.message}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewClient(true);
                      setValue("clientId", undefined);
                      setValue("clientEmail", "");
                      setValue("clientFirstName", "");
                      setValue("clientLastName", "");
                    }}
                    className="text-sm font-semibold text-primary underline"
                  >
                    + Create new client
                  </button>
                </div>
              ) : (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...register("clientEmail")}
                      className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                      placeholder="client@example.com"
                    />
                    {errors.clientEmail && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <span className="text-red-500">•</span> {errors.clientEmail.message}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                      💡 A temporary password will be generated and displayed after booking creation
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      {...register("clientFirstName")}
                      className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      {...register("clientLastName")}
                      className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                      placeholder="Doe"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      {...register("clientPhone")}
                      className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Service Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Service Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    {...register("serviceType")}
                    className="w-full px-4 py-2.5 pr-10 border border-[#d7d1c4] rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022] appearance-none"
                  >
                    <option value="">Select a service</option>
                    {serviceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#5c5a55] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.serviceType && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <span className="text-red-500">•</span> {errors.serviceType.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Frequency
                </label>
                <div className="relative">
                  <select
                    {...register("serviceFrequency")}
                    className="w-full px-4 py-2.5 pr-10 border border-[#d7d1c4] rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022] appearance-none"
                  >
                    <option value="">Select frequency (optional)</option>
                    <option value="ONE_TIME">One-Time</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Bi-Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#5c5a55] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cleaner(s) (Optional)
                </label>

                {cleanerAvailabilityQuery.isLoading ? (
                  <div className="w-full px-4 py-3 border border-[#d7d1c4] rounded-lg bg-[#f7f4ed] flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm text-gray-600">Checking availability...</span>
                  </div>
                ) : cleanersWithAvailability.length === 0 ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        multiple
                        value={selectedCleanerIds.map(String)}
                        onChange={handleCleanerMultiChange}
                        className="w-full px-4 py-2.5 pr-10 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022] appearance-none"
                      >
                        {cleaners.map((cleaner) => (
                          <option key={cleaner.id} value={cleaner.id}>
                            {cleaner.firstName} {cleaner.lastName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#5c5a55] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Up to 2 cleaners. Time estimate per cleaner is shown above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        multiple
                        value={selectedCleanerIds.map(String)}
                        onChange={handleCleanerMultiChange}
                        className="w-full px-4 py-2.5 pr-10 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022] appearance-none"
                      >
                        {cleanersWithAvailability.map((cleaner) => (
                          <option key={cleaner.id} value={cleaner.id}>
                            {cleaner.isAvailable ? "✓" : "⚠"} {cleaner.firstName} {cleaner.lastName}
                            {!cleaner.isAvailable && cleaner.conflictType === "BOOKED" && " (Booked)"}
                            {!cleaner.isAvailable && cleaner.conflictType === "TIME_OFF" && " (Time Off)"}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#5c5a55] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Up to 2 cleaners. Time estimate per cleaner is shown above.</p>

                    {/* Availability Legend */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-3 h-3" />
                        <span>Booked</span>
                      </div>
                      <div className="flex items-center gap-1 text-orange-600">
                        <CalendarOff className="w-3 h-3" />
                        <span>Time Off</span>
                      </div>
                    </div>

                    {/* Show conflict details for selected cleaner */}
                    {(selectedCleaner && !selectedCleaner.isAvailable) || conflictsQuery.data?.bookingConflicts?.length ? (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-red-900 mb-1">
                              Cleaner Unavailable
                            </p>
                            <p className="text-sm text-red-700">
                              {selectedCleaner && !selectedCleaner.isAvailable
                                ? selectedCleaner.conflictDetails
                                : "Cleaner has another booking at this time"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Admin Override Section */}
              {isSelectedCleanerUnavailable && (
                <div className="md:col-span-2 mt-2">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={overrideConflict}
                            onChange={(e) => setOverrideConflict(e.target.checked)}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                          />
                          <span className="text-sm font-semibold text-yellow-900">
                            Override conflict and assign anyway (Admin)
                          </span>
                        </label>
                        <p className="text-xs text-yellow-700 mt-1 ml-6">
                          Check this box to assign this cleaner despite the scheduling conflict. Use with caution.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <Controller
                  name="scheduledDate"
                  control={control}
                  render={({ field }) => (
                    <BookingCalendarPicker
                      value={field.value || ""}
                      onChange={field.onChange}
                      error={errors.scheduledDate?.message}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  {...register("scheduledTime")}
                  className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                />
              </div>
            </div>
          </div>

          {/* Property Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Property Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  House Square Footage
                </label>
                <input
                  type="number"
                  {...register("houseSquareFootage", { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                  placeholder="e.g., 2000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Basement Square Footage
                </label>
                <input
                  type="number"
                  {...register("basementSquareFootage", { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                  placeholder="e.g., 500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Bedrooms
                </label>
                <input
                  type="number"
                  {...register("numberOfBedrooms", { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                  placeholder="e.g., 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Bathrooms
                </label>
                <input
                  type="number"
                  {...register("numberOfBathrooms", { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                  placeholder="e.g., 2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Cleaners Requested
                </label>
                <input
                  type="number"
                  {...register("numberOfCleanersRequested", { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                  placeholder="e.g., 2"
                />
                {numberOfCleanersRequested && numberOfCleanersRequested > 1 && durationHours && (
                  <p className="text-xs text-gray-500 mt-1">
                    Auto time estimate: {formatDurationHours(durationHours / numberOfCleanersRequested)} per cleaner
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cleaner Payment Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("cleanerPaymentAmount", { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                  placeholder="e.g., 90.00"
                />
              </div>
            </div>
          </div>

          {/* Extras Section */}
          {extraServices.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Extra Services</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Select additional services to include</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {extraServices.map((extra) => (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => handleToggleExtra(extra.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${selectedExtras.includes(extra.id)
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                          {extra.extraName}
                        </h4>
                        {extra.extraDescription && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {extra.extraDescription}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs">
                          {extra.priceAmount !== null && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium">
                              +${extra.priceAmount.toFixed(2)}
                            </span>
                          )}
                          {extra.timeAmount !== null && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                              +{extra.timeAmount}h
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedExtras.includes(extra.id)
                          ? "bg-primary border-primary"
                          : "border-gray-300"
                          }`}
                      >
                        {selectedExtras.includes(extra.id) && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Section */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pricing & Duration</h3>
                <p className="text-xs text-gray-600 mt-0.5">Automatically calculated based on pricing rules</p>
              </div>
            </div>

            {/* Auto-calculated price display */}
            {priceCalculationQuery.data && serviceType && (
              <div className="mb-4 p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Calculated Totals</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
                        <p className="text-xs text-gray-600 mb-1 font-medium">Total Price</p>
                        <p className="text-2xl font-bold text-green-700">
                          ${priceCalculationQuery.data.price.toFixed(2)}
                        </p>
                      </div>
                      {priceCalculationQuery.data.durationHours !== null &&
                        priceCalculationQuery.data.durationHours !== undefined && (
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-600 mb-1 font-medium">Est. Duration</p>
                            <p className="text-2xl font-bold text-blue-700">
                              {formatDurationHours(priceCalculationQuery.data.durationHours)}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                  {priceCalculationQuery.data.breakdown.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                      className="text-sm text-primary hover:text-primary-dark font-medium whitespace-nowrap px-3 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                    >
                      {showPriceBreakdown ? "Hide" : "Show"} Breakdown
                    </button>
                  )}
                </div>

                {/* Price Breakdown */}
                {showPriceBreakdown && priceCalculationQuery.data.breakdown.length > 0 && (
                  <div className="pt-4 border-t border-green-200">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Price Breakdown:</p>
                    <div className="space-y-2">
                      {priceCalculationQuery.data.breakdown.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">{item.description}</span>
                          <span className="font-semibold text-gray-900">
                            ${item.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {priceCalculationQuery.isLoading && serviceType && (
              <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent"></div>
                  <p className="text-sm text-gray-600 font-medium">Calculating price...</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Duration (read-only, auto-calculated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <div className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg bg-[#f7f4ed] text-gray-800 font-semibold h-[46px] flex items-center">
                  {formatDurationHours(watch("durationHours"))}
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  ✓ Automatically calculated
                </p>
              </div>

              {/* Price (read-only, auto-calculated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("finalPrice", { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg bg-[#f7f4ed] text-gray-600 cursor-not-allowed"
                  placeholder="Auto-calculated"
                  readOnly
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  ✓ Automatically calculated
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Saved Cards (client)</label>
                {paymentMethodsQuery.isLoading ? (
                  <div className="w-full px-4 py-3 border border-[#d7d1c4] rounded-lg bg-[#f7f4ed] text-sm text-gray-600">
                    Loading cards...
                  </div>
                ) : ((paymentMethodsQuery.data as any)?.paymentMethods?.length ?? 0) > 0 ? (
                  <div className="space-y-2">
                    {((paymentMethodsQuery.data as any)?.paymentMethods || []).map((pm: any) => (
                      <label key={pm.id} className="flex items-center gap-3 px-4 py-3 border border-[#d7d1c4] rounded-lg bg-[#f7f4ed] text-[#163022]">
                        <input
                          type="radio"
                          name="savedCard"
                          value={pm.id}
                          onChange={() => {
                            setValue("paymentMethod", "CREDIT_CARD");
                            setValue("paymentDetails", `${pm.brand ?? "Card"} •••• ${pm.last4 ?? ""}`);
                          }}
                          className="text-primary focus:ring-primary"
                        />
                        <div className="text-sm">
                          <div className="font-semibold">{pm.brand ?? "Card"} •••• {pm.last4 ?? ""}</div>
                          <div className="text-xs text-gray-600">Expires {pm.exp_month}/{pm.exp_year}</div>
                          {pm.isDefault && <div className="text-xs text-primary font-semibold">Default</div>}
                        </div>
                      </label>
                    ))}
                    <p className="text-xs text-gray-500">Selecting a saved card fills payment details; charging still follows normal flow.</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No saved cards for this client.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="relative">
                  <select
                    {...register("paymentMethod")}
                    className="w-full px-4 py-2.5 pr-10 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022] appearance-none"
                  >
                    <option value="">Select payment method (optional)</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="CASH">Cash</option>
                    <option value="ZELLE">Zelle</option>
                    <option value="VENMO">Venmo</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#5c5a55] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Details
                </label>
                <input
                  type="text"
                  {...register("paymentDetails")}
                  className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                  placeholder="e.g., Last 4 digits: 1234"
                />
              </div>
            </div>
          </div>

          {/* Address & Instructions Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Location & Notes</h3>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input type="hidden" name="address" value={watch("address") || ""} />
                <input type="hidden" name="placeId" value={watch("placeId") || ""} />
                <input type="hidden" name="latitude" value={watch("latitude") ?? ""} />
                <input type="hidden" name="longitude" value={watch("longitude") ?? ""} />
                <AddressAutocomplete
                  value={watch("address") || ""}
                  onChange={(val) => setValue("address", val)}
                  onSelect={(val) => {
                    setValue("address", val);
                    setValue("placeId", "");
                    setValue("latitude", undefined);
                    setValue("longitude", undefined);
                  }}
                  onPlaceSelect={(payload) => {
                    const fullAddress = payload.address;
                    const streetPart = (payload.streetNumber && payload.route)
                      ? `${payload.streetNumber} ${payload.route}`
                      : fullAddress.split(",")[0];

                    setValue("address", streetPart || "");
                    setValue("addressLine1", streetPart || "");
                    if (payload.placeId) setValue("placeId", payload.placeId || "");
                    if (typeof payload.lat === "number") setValue("latitude", payload.lat ?? undefined);
                    if (typeof payload.lng === "number") setValue("longitude", payload.lng ?? undefined);
                    if (payload.city) setValue("city", payload.city || "");
                    if (payload.state) setValue("state", payload.state || "");
                    if (payload.postalCode) setValue("postalCode", payload.postalCode || "");
                  }}
                  enablePlaces={Boolean(googlePlacesKey)}
                />
                {errors.address && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <span className="text-red-500">•</span> {errors.address.message}
                  </p>
                )}
                {!googlePlacesKey && (
                  <p className="mt-1 text-xs text-gray-500">Add VITE_GOOGLE_PLACES_KEY for live autocomplete.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apt / Unit #
                </label>
                <input
                  type="text"
                  {...register("apartment")}
                  className="w-full px-4 py-3 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                  placeholder="e.g., Apt #329"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    {...register("city")}
                    className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                    placeholder="Detroit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    {...register("state")}
                    className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                    placeholder="MI"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    {...register("postalCode")}
                    className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow bg-[#f7f4ed] text-[#163022]"
                    placeholder="48201"
                  />
                </div>
              </div>
              <input type="hidden" {...register("placeId")} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  {...register("specialInstructions")}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow resize-none bg-[#f7f4ed] text-[#163022]"
                  placeholder="Any special instructions for the cleaner..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Private Booking Note
                </label>
                <textarea
                  {...register("privateBookingNote")}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow resize-none bg-[#f7f4ed] text-[#163022]"
                  placeholder="Visible to admins only"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Private Customer Note
                </label>
                <textarea
                  {...register("privateCustomerNote")}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow resize-none bg-[#f7f4ed] text-[#163022]"
                  placeholder="Customer-specific notes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note For Service Provider
                </label>
                <textarea
                  {...register("providerNote")}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] transition-shadow resize-none bg-[#f7f4ed] text-[#163022]"
                  placeholder="Instructions for cleaner(s)"
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Sticky Footer Actions */}
      <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
        <div className="flex flex-col gap-2">
          {booking && booking.finalPrice !== null && finalPriceValue !== undefined && finalPriceValue !== booking.finalPrice && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              Price changed from ${Number(booking.finalPrice).toFixed(2)} to ${Number(finalPriceValue).toFixed(2)}. Hold adjustments will be attempted on save.
            </p>
          )}
          {isSelectedCleanerUnavailable && !overrideConflict && (
            <p className="text-xs text-red-600 text-right flex items-center justify-end gap-1">
              <AlertTriangle className="w-3 h-3" />
              Cleaner blocked by time-off/double-book. Check "Override conflict" to force assign (logged).
            </p>
          )}
          <div className="flex gap-3">
            {booking && onDelete && (
              <button
                type="button"
                onClick={() => {
                  const clientName = clients.find(c => c.id === booking.clientId);
                  const name = clientName ? `${clientName.firstName} ${clientName.lastName}` : 'this client';
                  onDelete(booking.id, name);
                }}
                disabled={isDeleting}
                className="px-5 py-2.5 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-300 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
            <div className="flex-1"></div>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isDeleting || (isSelectedCleanerUnavailable && !overrideConflict)}
              className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isSubmitting
                ? "Saving..."
                : booking
                  ? "Update Booking"
                  : "Create Booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
