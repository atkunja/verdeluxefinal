// @ts-nocheck
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTRPC } from "~/trpc/react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/authStore";
import { PortalLayout } from "~/components/PortalLayout";
import { Calendar, LogOut, Clock, MapPin, User, Package, CheckCircle, XCircle, Loader, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { formatTime12Hour, formatDetroitDate, formatDurationHours } from "~/utils/formatTime";

interface Booking {
  id: number;
  clientId: number;
  cleanerId: number | null;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number | null;
  address: string;
  specialInstructions: string | null;
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
  client: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
  cleaner: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  } | null;
}

const clientPortalSearchSchema = z.object({
  view: z.enum(["dashboard", "bookings"]).default("dashboard"),
});

export const Route = createFileRoute("/client-portal/")({
  component: ClientPortalPage,
  validateSearch: zodValidator(clientPortalSearchSchema),
});

function ClientPortalPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, user, clearAuth } = useAuthStore();
  const { view } = Route.useSearch();
  // Map view to activeTab for backwards compatibility with existing UI
  const activeTab = view === "bookings" ? "all" : "upcoming";
  const queryClient = useQueryClient();

  // Redirect if not authenticated or not a client
  useEffect(() => {
    if (!token || !user) {
      toast.error("Please log in to access the client portal");
      navigate({ to: "/" });
      return;
    }
    if (user.role !== "CLIENT") {
      toast.error("Access denied. Client account required.");
      navigate({ to: "/" });
    }
  }, [token, user, navigate]);

  const upcomingQuery = useQuery(
    trpc.getUpcomingBookings.queryOptions(undefined, { enabled: !!token })
  );

  const allBookingsQuery = useQuery(
    trpc.getAllBookings.queryOptions(undefined, { enabled: !!token })
  );

  // Handle auth errors - if queries fail with UNAUTHORIZED, session is expired
  useEffect(() => {
    const upcomingError = upcomingQuery.error?.message;
    const allError = allBookingsQuery.error?.message;
    if (upcomingError?.includes("UNAUTHORIZED") || allError?.includes("UNAUTHORIZED")) {
      clearAuth();
      toast.error("Your session has expired. Please log in again.");
      navigate({ to: "/" });
    }
  }, [upcomingQuery.error, allBookingsQuery.error, clearAuth, navigate]);

  const cancelMutation = useMutation(trpc.cancelBookingClient.mutationOptions({
    onSuccess: () => {
      toast.success("Booking cancelled successfully");
      queryClient.invalidateQueries();
      setCancelBookingId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to cancel booking");
    }
  }));

  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);

  const handleBookAgain = (booking: any) => {
    const draft = {
      address: {
        formatted: booking.address,
        street: booking.addressLine1,
        city: booking.city,
        state: booking.state,
        zip: booking.postalCode,
        placeId: booking.placeId,
        lat: booking.latitude,
        lng: booking.longitude,
      },
      cleanType: booking.serviceType.toLowerCase(),
      beds: booking.numberOfBedrooms || 0,
      baths: booking.numberOfBathrooms || 0,
      cleanliness: 3, // Default
      kids: false,
      pets: false,
      extras: [],
      schedule: {},
      contact: {
        fullName: `${booking.client.firstName || ''} ${booking.client.lastName || ''}`.trim(),
        email: booking.client.email,
        phone: booking.client.phone,
      },
      logistics: {
        homeDuringAppt: false,
        acceptedTerms: true, // They've booked before
      },
      pricing: {
        base: 0,
        extras: 0,
        total: 0,
        durationMinutes: 0,
      },
      meta: {
        step: 0,
        createdAt: new Date().toISOString(),
      },
    };
    window.localStorage.setItem("bookingDraft_vella", JSON.stringify(draft));
    toast.success("Preferences saved! Redirecting to booking quiz...");
    navigate({ to: "/book-now" });
  };

  const handleLogout = () => {
    clearAuth();
    toast.success("Logged out successfully");
    navigate({ to: "/" });
  };

  if (!token || !user) {
    return null;
  }

  const currentQuery = activeTab === "upcoming" ? upcomingQuery : allBookingsQuery;

  const getPaymentMethodDisplay = (method: string | null) => {
    if (!method) return "N/A";
    const map: Record<string, string> = {
      CREDIT_CARD: "Credit Card",
      CASH: "Cash",
      ZELLE: "Zelle",
      VENMO: "Venmo",
      OTHER: "Other",
    };
    return map[method] || method;
  };

  return (
    <PortalLayout portalType="client">
      <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold font-heading">
                  Welcome Back! 👋
                </h1>
                <p className="mt-2 text-green-100 text-base">
                  {user.firstName || user.email}
                </p>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-center">
                <button
                  onClick={() => navigate({ to: "/book-now" })}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-primary rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl font-bold"
                >
                  <Calendar className="w-4 h-4" />
                  <span>New Booking</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20 shadow-lg hover:shadow-xl"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Tabs */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
              <nav className="flex gap-1">
                <button
                  onClick={() => navigate({ to: "/client-portal", search: { view: "dashboard" } })}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium text-sm transition-all duration-200 ${view === "dashboard"
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Upcoming Bookings
                  </span>
                </button>
                <button
                  onClick={() => navigate({ to: "/client-portal", search: { view: "bookings" } })}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium text-sm transition-all duration-200 ${view === "bookings"
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Package className="w-4 h-4" />
                    All Bookings
                  </span>
                </button>
              </nav>
            </div>
          </div>

          {/* Bookings Display */}
          {currentQuery.isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                <p className="text-gray-600 font-medium">Loading your bookings...</p>
              </div>
            </div>
          ) : currentQuery.isError ? (
            <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <p className="text-red-900 font-semibold text-lg mb-1">Error Loading Bookings</p>
                  <p className="text-red-700 text-sm">Please try refreshing the page</p>
                </div>
              </div>
            </div>
          ) : currentQuery.data?.bookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-900 font-semibold text-lg mb-1">
                    {activeTab === "upcoming" ? "No Upcoming Bookings" : "No Bookings Yet"}
                  </p>
                  <p className="text-gray-600 text-sm mb-4">
                    {activeTab === "upcoming"
                      ? "You don't have any upcoming cleaning appointments"
                      : "Start by booking your first cleaning service"}
                  </p>
                  <button
                    onClick={() => navigate({ to: "/book-now" })}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                  >
                    <Calendar className="w-4 h-4" />
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {currentQuery.data?.bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden group flex flex-col"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="text-xs font-bold text-primary uppercase tracking-wider">
                      {booking.serviceType}
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${booking.status === "CANCELLED" ? "bg-red-50 text-red-600" :
                      booking.status === "COMPLETED" ? "bg-green-50 text-green-600" :
                        "bg-blue-50 text-blue-600"
                      }`}>
                      {booking.status}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1">
                    <h3 className="font-bold text-lg mb-4 text-gray-900 font-heading group-hover:text-primary transition-colors">
                      {booking.serviceType}
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-500 text-xs mb-0.5">Date</p>
                          <p className="text-gray-900 font-medium">
                            {formatDetroitDate(booking.scheduledDate, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-500 text-xs mb-0.5">Time</p>
                          <p className="text-gray-900 font-medium">{formatTime12Hour(booking.scheduledTime)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-500 text-xs mb-0.5">Location</p>
                          <p className="text-gray-900 font-medium line-clamp-2">{booking.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer with Actions */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-2">
                    <button
                      onClick={() => handleBookAgain(booking)}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Book Again
                    </button>
                    {booking.status === "PENDING" || booking.status === "CONFIRMED" ? (
                      <button
                        onClick={() => setCancelBookingId(booking.id)}
                        className="flex-1 px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors shadow-sm"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancelBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Booking?</h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to cancel this booking? This action cannot be undone.
              {activeTab === "upcoming" ? " Custom cancellation fees may apply if cancelled within 24 hours." : ""}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelBookingId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                disabled={cancelMutation.isPending}
              >
                Go Back
              </button>
              <button
                onClick={() => cancelMutation.mutate({ bookingId: cancelBookingId })}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50"
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
