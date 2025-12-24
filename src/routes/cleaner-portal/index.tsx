interface ChecklistItem {
  id: number;
  description: string;
  order: number;
  isCompleted: boolean;
  completedAt: string | null;
  completedBy: number | null;
}

interface Payment {
  id: number;
  bookingId: number;
  amount: number;
  paidAt: string | Date | null;
  createdAt: string | Date;
  booking: {
    serviceType: string;
    scheduledDate: string | Date;
  };
}

interface TimeOffRequest {
  id: number;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedBy?: {
    firstName: string;
    lastName: string;
  };
  reviewedAt?: string;
  adminNotes?: string;
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/authStore";
import { PortalLayout } from "~/components/PortalLayout";
import { Calendar, DollarSign, LogOut, Clock, MapPin, User, CheckCircle, XCircle, Loader, AlertCircle, TrendingUp, Wallet, Clock3, CheckSquare, Square, CalendarOff, Send, Edit, Camera } from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { formatTime12Hour, formatDetroitDate, formatDurationHours } from "~/utils/formatTime";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CleanerCalendarView } from "~/components/CleanerCalendarView";
import { CleanerPunchClock } from "~/components/time/CleanerPunchClock";
import { BookingPhotoManager } from "~/components/cleaner/BookingPhotoManager";

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
  checklist?: {
    id: number;
    items: {
      id: number;
      description: string;
      order: number;
      isCompleted: boolean;
      completedAt: string | null;
      completedBy: number | null;
    }[];
    template: {
      name: string;
      serviceType: string;
    };
  } | null;
}

const cleanerPortalSearchSchema = z.object({
  view: z.enum(["dashboard", "schedule", "payments", "requests"]).default("dashboard"),
});

export const Route = createFileRoute("/cleaner-portal/")({
  component: CleanerPortalPage,
  validateSearch: zodValidator(cleanerPortalSearchSchema),
});

// Helper function to parse date string in local time (avoids UTC timezone issues)
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = (dateString || "").split('-').map(Number);
  // Month is 0-indexed in JavaScript Date constructor
  return new Date(year || 0, (month || 1) - 1, day || 1);
};

function CleanerPortalPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, user, clearAuth } = useAuthStore();
  const { view } = Route.useSearch();
  const [selectedBookingChecklist, setSelectedBookingChecklist] = useState<number | undefined>();
  const queryClient = useQueryClient();

  // State for date range inputs
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // State for applied filters (what's actually sent to the API)
  const [appliedStartDate, setAppliedStartDate] = useState<string | undefined>(undefined);
  const [appliedEndDate, setAppliedEndDate] = useState<string | undefined>(undefined);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<Booking | null>(null);

  // State for editing time-off requests
  const [editingRequest, setEditingRequest] = useState<{
    id: number;
    startDate: string;
    endDate: string;
    reason?: string;
  } | null>(null);

  // Redirect if not authenticated or not a cleaner
  useEffect(() => {
    if (!token || !user) {
      toast.error("Please log in to access the cleaner portal");
      Promise.resolve().then(() => {
        navigate({ to: "/login" });
      });
      return;
    }
    if (user.role !== "CLEANER") {
      toast.error("Access denied. Cleaner account required.");
      Promise.resolve().then(() => {
        navigate({ to: "/" });
      });
    }
  }, [token, user, navigate]);

  const scheduleQuery = useQuery(trpc.getSchedule.queryOptions(undefined, { enabled: Boolean(token) }));

  const paymentsQuery = useQuery(
    trpc.getPayments.queryOptions(
      {
        startDate: appliedStartDate,
        endDate: appliedEndDate,
      },
      { enabled: Boolean(token) }
    )
  );

  const timeOffRequestsQuery = useQuery(trpc.getTimeOffRequests.queryOptions(undefined, { enabled: Boolean(token) }));

  const availabilityQuery = useQuery(
    trpc.availability.getCleanerAvailability.queryOptions(
      { cleanerId: user?.id ?? 0 },
      { enabled: Boolean(token && user?.id) }
    )
  );

  const timeEntriesQuery = useQuery(
    trpc.time.getTimeEntries.queryOptions(
      { bookingId: selectedBookingDetail?.id ?? 0 },
      { enabled: Boolean(token && selectedBookingDetail?.id) }
    )
  );
  const setAvailabilityMutation = useMutation(
    trpc.availability.setCleanerAvailability.mutationOptions({
      onSuccess: () => {
        toast.success("Availability saved");
        queryClient.invalidateQueries({ queryKey: trpc.availability.getCleanerAvailability.queryKey() });
      },
      onError: (error) => toast.error(error.message || "Failed to save availability"),
    })
  );

  const defaultWeek = [
    { dayOfWeek: 1, label: "Monday", startTime: "07:30", endTime: "17:00", isAvailable: true },
    { dayOfWeek: 2, label: "Tuesday", startTime: "07:30", endTime: "17:00", isAvailable: true },
    { dayOfWeek: 3, label: "Wednesday", startTime: "07:30", endTime: "17:00", isAvailable: true },
    { dayOfWeek: 4, label: "Thursday", startTime: "07:30", endTime: "17:00", isAvailable: true },
    { dayOfWeek: 5, label: "Friday", startTime: "07:30", endTime: "17:00", isAvailable: true },
    { dayOfWeek: 6, label: "Saturday", startTime: "08:00", endTime: "14:00", isAvailable: false },
    { dayOfWeek: 0, label: "Sunday", startTime: "08:00", endTime: "14:00", isAvailable: false },
  ];

  const [availabilityState, setAvailabilityState] = useState(defaultWeek);

  useEffect(() => {
    if (availabilityQuery.data) {
      const mapped = defaultWeek.map((day) => {
        const found = availabilityQuery.data.find((a: any) => a.dayOfWeek === day.dayOfWeek);
        return found
          ? {
            dayOfWeek: found.dayOfWeek,
            label: day.label,
            startTime: found.startTime,
            endTime: found.endTime,
            isAvailable: found.isAvailable,
          }
          : day;
      });
      setAvailabilityState(mapped);
    }
  }, [availabilityQuery.data]);

  const handleAvailabilityChange = (idx: number, field: "startTime" | "endTime" | "isAvailable", value: string | boolean) => {
    setAvailabilityState((prev) => {
      const next = [...prev];
      if (next[idx]) {
        // ensure logical order for start/end
        if (field === "startTime" || field === "endTime") {
          next[idx] = { ...next[idx]!, [field]: value as string };
        } else {
          next[idx] = { ...next[idx]!, [field]: value as boolean };
        }
      }
      return next;
    });
  };

  const handleCopyToAll = (sourceIdx: number) => {
    const source = availabilityState[sourceIdx];
    if (!source) return;
    setAvailabilityState((prev) =>
      prev.map((day, idx) =>
        idx === sourceIdx
          ? day
          : {
            ...day,
            startTime: (source as any).startTime || "08:00",
            endTime: (source as any).endTime || "17:00",
            isAvailable: !!(source as any).isAvailable,
          }
      )
    );
  };

  const handleSaveAvailability = () => {
    if (!user?.id) return;
    setAvailabilityMutation.mutate({
      cleanerId: user.id,
      availability: availabilityState.map(({ dayOfWeek, startTime, endTime, isAvailable }) => ({
        dayOfWeek,
        startTime,
        endTime,
        isAvailable,
      })),
    });
  };

  const submitTimeOffRequestMutation = useMutation(
    trpc.submitTimeOffRequest.mutationOptions({
      onSuccess: () => {
        toast.success("Time-off request submitted successfully!");
        queryClient.invalidateQueries({ queryKey: trpc.getTimeOffRequests.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to submit request");
      },
    })
  );

  const deleteTimeOffRequestMutation = useMutation(
    trpc.deleteTimeOffRequest.mutationOptions({
      onSuccess: () => {
        toast.success("Request canceled successfully!");
        queryClient.invalidateQueries({ queryKey: trpc.getTimeOffRequests.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to cancel request");
      },
    })
  );

  const updateTimeOffRequestMutation = useMutation(
    trpc.updateTimeOffRequest.mutationOptions({
      onSuccess: () => {
        toast.success("Request updated successfully!");
        queryClient.invalidateQueries({ queryKey: trpc.getTimeOffRequests.queryKey() });
        setEditingRequest(null);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update request");
      },
    })
  );

  const updateChecklistItemMutation = useMutation(
    trpc.updateBookingChecklistItem.mutationOptions({
      onSuccess: () => {
        toast.success("Checklist updated!");
        queryClient.invalidateQueries({ queryKey: trpc.getSchedule.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update checklist");
      },
    })
  );

  const handleToggleChecklistItem = (itemId: number, currentStatus: boolean) => {
    updateChecklistItemMutation.mutate({
      itemId,
      isCompleted: !currentStatus,
    });
  };

  const handleViewChecklist = (bookingId: number) => {
    setSelectedBookingChecklist(bookingId);
  };

  const handleCloseChecklist = () => {
    setSelectedBookingChecklist(undefined);
  };

  const handleApplyFilter = () => {
    setAppliedStartDate(startDate || undefined);
    setAppliedEndDate(endDate || undefined);
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    setAppliedStartDate(undefined);
    setAppliedEndDate(undefined);
  };

  const handleCancelRequest = (requestId: number) => {
    if (confirm("Are you sure you want to cancel this request?")) {
      deleteTimeOffRequestMutation.mutate({ requestId });
    }
  };

  const handleEditRequest = (request: TimeOffRequest) => {
    // Convert ISO date strings to YYYY-MM-DD format for date inputs
    const startDate = new Date(request.startDate).toISOString().split('T')[0];
    const endDate = new Date(request.endDate).toISOString().split('T')[0];

    setEditingRequest({
      id: request.id,
      startDate: startDate ?? "",
      endDate: endDate ?? "",
      reason: request.reason || "",
    });
  };

  const handleUpdateRequest = (data: { startDate: string; endDate: string; reason?: string }) => {
    if (!editingRequest) return;

    updateTimeOffRequestMutation.mutate({
      requestId: editingRequest.id,
      startDate: `${data.startDate}T12:00:00.000Z`,
      endDate: `${data.endDate}T12:00:00.000Z`,
      reason: data.reason,
    });
  };

  const handleLogout = () => {
    clearAuth();
    toast.success("Logged out successfully");
    navigate({ to: "/login" });
  };

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

  if (!token || !user) {
    return null;
  }

  return (
    <PortalLayout portalType="cleaner">
      <div className="bg-[#edeae1] min-h-screen">
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
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20 shadow-lg hover:shadow-xl self-start sm:self-center"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Time Tracking */}
          <div className="grid grid-cols-1">
            <CleanerPunchClock
              activeBookings={(scheduleQuery.data as any)?.bookings?.map((b: any) => ({
                id: b.id,
                label: `${b.serviceType} • ${formatDetroitDate(b.scheduledDate)} ${formatTime12Hour(b.scheduledTime)}`,
              }))}
            />
          </div>

          {/* Schedule Section */}
          {(view === "dashboard" || view === "schedule") && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 font-heading">My Schedule</h2>
              </div>

              {scheduleQuery.isLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                    <p className="text-gray-600 font-medium">Loading your schedule...</p>
                  </div>
                </div>
              ) : scheduleQuery.isError ? (
                <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                      <p className="text-red-900 font-semibold text-lg mb-1">Error Loading Schedule</p>
                      <p className="text-red-700 text-sm">Please try refreshing the page</p>
                    </div>
                  </div>
                </div>
              ) : scheduleQuery.data?.bookings.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold text-lg mb-1">No Bookings Scheduled</p>
                      <p className="text-gray-600 text-sm">You don't have any cleaning appointments yet</p>
                    </div>
                  </div>
                </div>
              ) : view === "schedule" ? (
                // Calendar view for schedule page
                <CleanerCalendarView
                  bookings={(scheduleQuery.data as any)?.bookings || []}
                  onViewChecklist={handleViewChecklist}
                />
              ) : (
                // Card view for dashboard
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {scheduleQuery.data?.bookings.map((booking) => {
                    const checklist = booking.checklist;
                    const completedItems = checklist?.items.filter(item => item.isCompleted).length || 0;
                    const totalItems = checklist?.items.length || 0;
                    const hasChecklist = checklist && totalItems > 0;

                    return (
                      <div
                        key={booking.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden group"
                      >
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex-1" />
                            {hasChecklist && (
                              <button
                                onClick={() => handleViewChecklist(booking.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-xs font-semibold"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                {completedItems}/{totalItems}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5">
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
                                {booking.durationHours !== null && (
                                  <p className="text-gray-600 text-xs mt-1">
                                    Duration: {formatDurationHours(booking.durationHours / Math.max(1, booking.numberOfCleanersRequested || 1))}
                                    {booking.numberOfCleanersRequested && booking.numberOfCleanersRequested > 1 ? ` • ${booking.numberOfCleanersRequested} cleaners` : ""}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-500 text-xs mb-0.5">Location</p>
                                <p className="text-gray-900 font-medium line-clamp-2">{booking.address}</p>
                                <p className="text-gray-500 text-xs mt-1">Payment: {getPaymentMethodDisplay(booking.paymentMethod)}</p>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-500 text-xs mb-0.5">Client</p>
                                  <p className="text-gray-900 font-medium">
                                    {booking.client.firstName} {booking.client.lastName}
                                  </p>
                                  {booking.client.phone && (
                                    <a
                                      href={`tel:${booking.client.phone}`}
                                      className="text-primary hover:text-primary-dark text-xs mt-1 inline-block"
                                    >
                                      📞 {booking.client.phone}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        {booking.specialInstructions && (
                          <div className="px-5 pb-5">
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <p className="text-xs text-gray-600 font-semibold mb-1.5">
                                Special Instructions
                              </p>
                              <p className="text-xs text-gray-700 leading-relaxed">
                                {booking.specialInstructions}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="px-5 pb-5">
                          <button
                            onClick={() => setSelectedBookingDetail(booking as any)}
                            className="w-full mt-2 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Payments Section */}
          {view === "payments" && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 font-heading">Payments</h2>
              </div>

              {paymentsQuery.isLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                    <p className="text-gray-600 font-medium">Loading payment information...</p>
                  </div>
                </div>
              ) : paymentsQuery.isError ? (
                <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                      <p className="text-red-900 font-semibold text-lg mb-1">Error Loading Payments</p>
                      <p className="text-red-700 text-sm">Please try refreshing the page</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Date Range Selector */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Payment Period</h3>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="flex-1">
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-2 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] bg-[#f7f4ed] text-[#163022]"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-4 py-2 border border-[#d7d1c4] rounded-lg focus:ring-2 focus:ring-primary focus:border-[#163022] bg-[#f7f4ed] text-[#163022]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleApplyFilter}
                          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium shadow-sm hover:shadow-md"
                        >
                          Apply
                        </button>
                        {(appliedStartDate || appliedEndDate) && (
                          <button
                            onClick={handleClearFilter}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    {(appliedStartDate || appliedEndDate) && (
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-medium">Active Filter:</span>{" "}
                        {appliedStartDate && (
                          <span>
                            From {formatDetroitDate(parseLocalDate(appliedStartDate))}
                          </span>
                        )}
                        {appliedStartDate && appliedEndDate && <span> </span>}
                        {appliedEndDate && (
                          <span>
                            To {formatDetroitDate(parseLocalDate(appliedEndDate))}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Enhanced Payment Summary Cards */}
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                    <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-lg p-6 text-white">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                      </div>
                      <p className="text-green-100 text-sm mb-2 font-medium">Total Earnings</p>
                      <p className="text-4xl font-bold">
                        ${paymentsQuery.data?.summary.totalEarnings.toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-2 font-medium">Paid</p>
                      <p className="text-4xl font-bold text-green-600">
                        ${paymentsQuery.data?.summary.paidEarnings.toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Clock3 className="w-6 h-6 text-yellow-600" />
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-2 font-medium">Pending</p>
                      <p className="text-4xl font-bold text-yellow-600">
                        ${paymentsQuery.data?.summary.pendingEarnings.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Payment History */}
                  {paymentsQuery.data?.payments.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                          <Wallet className="w-10 h-10 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-semibold text-lg mb-1">No Payment History</p>
                          <p className="text-gray-600 text-sm">
                            {appliedStartDate || appliedEndDate
                              ? "No payments found for the selected period. Try clearing the filter to see all payments."
                              : "Your payment history will appear here once you complete jobs"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 font-heading">Payment History</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Service
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paymentsQuery.data?.payments.map((payment: Payment) => (
                              <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                  {formatDetroitDate(payment.createdAt, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  <div className="font-medium text-gray-900">{payment.booking.serviceType}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {formatDetroitDate(payment.booking.scheduledDate, {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                  ${payment.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${payment.paidAt
                                      ? "bg-green-100 text-green-800 border border-green-200"
                                      : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                      }`}
                                  >
                                    {payment.paidAt ? (
                                      <>
                                        <CheckCircle className="w-3 h-3" />
                                        Paid
                                      </>
                                    ) : (
                                      <>
                                        <Clock3 className="w-3 h-3" />
                                        Pending
                                      </>
                                    )}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* Requests Section */}
          {view === "requests" && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CalendarOff className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 font-heading">Schedule Change Requests</h2>
              </div>

              {/* Submit New Request Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit New Request</h3>
                <TimeOffRequestForm
                  onSubmit={(data) => {
                    submitTimeOffRequestMutation.mutate({
                      startDate: `${data.startDate}T12:00:00.000Z`,
                      endDate: `${data.endDate}T12:00:00.000Z`,
                      reason: data.reason,
                    });
                  }}
                  isSubmitting={submitTimeOffRequestMutation.isPending}
                />
              </div>

              {/* Existing Requests List */}
              {timeOffRequestsQuery.isLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                    <p className="text-gray-600 font-medium">Loading your requests...</p>
                  </div>
                </div>
              ) : timeOffRequestsQuery.isError ? (
                <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                      <p className="text-red-900 font-semibold text-lg mb-1">Error Loading Requests</p>
                      <p className="text-red-700 text-sm">Please try refreshing the page</p>
                    </div>
                  </div>
                </div>
              ) : timeOffRequestsQuery.data?.requests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <CalendarOff className="w-10 h-10 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold text-lg mb-1">No Requests Yet</p>
                      <p className="text-gray-600 text-sm">Submit a request above to change your schedule or availability</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 font-heading">Your Requests</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {(timeOffRequestsQuery.data?.requests || []).map((request: any) => (
                      <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${request.status === "APPROVED"
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : request.status === "REJECTED"
                                    ? "bg-red-100 text-red-800 border border-red-200"
                                    : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                  }`}
                              >
                                {request.status === "APPROVED" ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Approved
                                  </>
                                ) : request.status === "REJECTED" ? (
                                  <>
                                    <XCircle className="w-3 h-3" />
                                    Rejected
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3" />
                                    Pending
                                  </>
                                )}
                              </span>
                              <span className="text-xs text-gray-500">
                                Submitted {formatDetroitDate(request.createdAt, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-900">
                                {formatDetroitDate(request.startDate, {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                                {" → "}
                                {formatDetroitDate(request.endDate, {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                              {request.reason && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Reason:</span> {request.reason}
                                </p>
                              )}
                              {request.reviewedBy && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Reviewed by {request.reviewedBy.firstName} {request.reviewedBy.lastName}
                                  {request.reviewedAt && (
                                    <> on {formatDetroitDate(request.reviewedAt, {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}</>
                                  )}
                                </p>
                              )}
                              {request.adminNotes && (
                                <p className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <span className="font-medium">Admin Notes:</span> {request.adminNotes}
                                </p>
                              )}
                            </div>
                          </div>
                          {request.status === "PENDING" && (
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleEditRequest(request)}
                                className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-xs font-semibold"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleCancelRequest(request.id)}
                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Availability (Figure 10) */}
          {(view === "dashboard" || view === "requests") && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-700" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 font-heading">Availability & Working Hours</h2>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                {availabilityQuery.data && availabilityQuery.data.length > 0 && user?.role === "CLEANER" && (
                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                    Availability changes require admin approval after initial setup. Contact admin if you need updates.
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  Set your weekly working hours. Use “Copy to all days” to quickly duplicate settings.
                </p>
                <div className="space-y-3">
                  {availabilityState.map((day, idx) => (
                    <div
                      key={day.dayOfWeek}
                      className="border border-gray-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:gap-3"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <label className="text-sm font-semibold text-gray-800 w-24">{day.label}</label>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => handleAvailabilityChange(idx, "startTime", e.target.value)}
                          className="px-3 py-2 border border-[#d7d1c4] rounded-lg text-sm bg-[#f7f4ed] text-[#163022]"
                          disabled={!day.isAvailable || availabilityQuery.isLoading}
                        />
                        <span className="text-xs text-gray-500">to</span>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => handleAvailabilityChange(idx, "endTime", e.target.value)}
                          className="px-3 py-2 border border-[#d7d1c4] rounded-lg text-sm bg-[#f7f4ed] text-[#163022]"
                          disabled={!day.isAvailable || availabilityQuery.isLoading}
                        />
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 ml-2">
                          <input
                            type="checkbox"
                            checked={day.isAvailable}
                            onChange={(e) => handleAvailabilityChange(idx, "isAvailable", e.target.checked)}
                            className="h-4 w-4 rounded border-[#d7d1c4] text-primary"
                            disabled={availabilityQuery.isLoading}
                          />
                          Available
                        </label>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <button
                          type="button"
                          className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                          onClick={() => handleCopyToAll(idx)}
                        >
                          Copy to all days
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveAvailability}
                    className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-50"
                    disabled={setAvailabilityMutation.isPending || availabilityQuery.isLoading}
                  >
                    {setAvailabilityMutation.isPending ? "Saving..." : "Save Availability"}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
      {selectedBookingDetail && (
        <div className="fixed inset-0 bg-black/50 z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedBookingDetail.serviceType}</h3>
                <p className="text-sm text-gray-600">
                  {formatDetroitDate(selectedBookingDetail.scheduledDate)} {formatTime12Hour(selectedBookingDetail.scheduledTime)}
                </p>
              </div>
              <button
                onClick={() => setSelectedBookingDetail(null)}
                className="text-gray-500 hover:text-gray-900"
              >
                ✕
              </button>
            </div>

            {/* Photos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 className="text-lg font-bold text-gray-900">Job Photos</h4>
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  <span className="text-xs text-gray-500 font-medium tracking-wide uppercase">Capture Work</span>
                </div>
              </div>

              <BookingPhotoManager
                bookingId={selectedBookingDetail.id}
                uploaderId={user.id}
              />
            </div>

            {/* Time Logs */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Time Logs</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                {(timeEntriesQuery.data ?? []).length > 0 ? (
                  <ul className="space-y-2 text-sm text-gray-700">
                    {(timeEntriesQuery.data ?? []).map((entry: any) => (
                      <li key={entry.id} className="border-b border-gray-200 pb-1">
                        <div className="flex justify-between">
                          <span>{new Date(entry.startTime).toLocaleString()}</span>
                          <span>{entry.endTime ? new Date(entry.endTime).toLocaleString() : "Active"}</span>
                        </div>
                        {(entry.lat || entry.lng || entry.locationNote) && (
                          <div className="text-xs text-gray-500">
                            {entry.lat && entry.lng ? `GPS: ${entry.lat.toFixed(3)},${entry.lng.toFixed(3)} ` : ""}
                            {entry.locationNote ? `• ${entry.locationNote}` : ""}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">No time logs yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {editingRequest && (
        <EditRequestModal
          request={editingRequest}
          onClose={() => setEditingRequest(null)}
          onSubmit={handleUpdateRequest}
          isSubmitting={updateTimeOffRequestMutation.isPending}
        />
      )
      }

      {/* Checklist Modal */}
      {
        selectedBookingChecklist && (
          <ChecklistModal
            booking={(scheduleQuery.data?.bookings.find(b => b.id === selectedBookingChecklist) as any)}
            onClose={handleCloseChecklist}
            onToggleItem={handleToggleChecklistItem}
            isUpdating={updateChecklistItemMutation.isPending}
          />
        )
      }
    </PortalLayout >
  );
}

interface EditRequestModalProps {
  request: {
    id: number;
    startDate: string;
    endDate: string;
    reason?: string;
  };
  onClose: () => void;
  onSubmit: (data: { startDate: string; endDate: string; reason?: string }) => void;
  isSubmitting: boolean;
}

function EditRequestModal({ request, onClose, onSubmit, isSubmitting }: EditRequestModalProps) {
  // Define validation schema
  const editRequestSchema = z.object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().optional(),
  }).refine((data) => {
    // Validate that end date is after start date
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  }, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ startDate: string; endDate: string; reason?: string }>({
    resolver: zodResolver(editRequestSchema),
    defaultValues: {
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason || "",
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Edit Time-Off Request</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="edit-startDate"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Start Date *
              </label>
              <input
                id="edit-startDate"
                type="date"
                {...register("startDate")}
                className="w-full rounded-md border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="edit-endDate"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                End Date *
              </label>
              <input
                id="edit-endDate"
                type="date"
                {...register("endDate")}
                className="w-full rounded-md border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="edit-reason"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Reason (Optional)
            </label>
            <textarea
              id="edit-reason"
              rows={3}
              {...register("reason")}
              className="w-full rounded-md border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
              placeholder="Provide a reason for your time-off request..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Update Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ChecklistModalProps {
  booking: Booking | undefined;
  onClose: () => void;
  onToggleItem: (itemId: number, currentStatus: boolean) => void;
  isUpdating: boolean;
}

function ChecklistModal({ booking, onClose, onToggleItem, isUpdating }: ChecklistModalProps) {
  if (!booking || !booking.checklist) return null;

  const checklist = booking.checklist;
  const completedItems = checklist.items.filter((item: ChecklistItem) => item.isCompleted).length;
  const totalItems = checklist.items.length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{checklist.template.name}</h2>
              <p className="text-green-100 text-sm">{booking.serviceType}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="font-bold">{completedItems} / {totalItems} ({progress}%)</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist Items */}
        <div className="p-6">
          <div className="space-y-3">
            {checklist.items.map((item: ChecklistItem, index: number) => (
              <button
                key={item.id}
                onClick={() => onToggleItem(item.id, item.isCompleted)}
                disabled={isUpdating}
                className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all duration-200 text-left ${item.isCompleted
                  ? "bg-green-50 border-green-200 hover:bg-green-100"
                  : "bg-white border-gray-200 hover:bg-gray-50 hover:border-primary/30"
                  } ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {item.isCompleted ? (
                    <CheckSquare className="w-6 h-6 text-green-600" />
                  ) : (
                    <Square className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-medium ${item.isCompleted
                        ? "text-green-900 line-through"
                        : "text-gray-900"
                        }`}
                    >
                      {item.description}
                    </p>
                    <span className="text-xs font-semibold text-gray-400 flex-shrink-0">
                      #{index + 1}
                    </span>
                  </div>
                  {item.isCompleted && item.completedAt && (
                    <p className="text-xs text-green-700 mt-1">
                      Completed {new Date(item.completedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              Close Checklist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TimeOffRequestFormProps {
  onSubmit: (data: { startDate: string; endDate: string; reason?: string }) => void;
  isSubmitting: boolean;
}

function TimeOffRequestForm({ onSubmit, isSubmitting }: TimeOffRequestFormProps) {
  // Define validation schema
  const timeOffRequestSchema = z.object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().optional(),
  }).refine((data) => {
    // Validate that end date is after start date
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  }, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ startDate: string; endDate: string; reason?: string }>({
    resolver: zodResolver(timeOffRequestSchema),
  });

  const handleFormSubmit = (data: { startDate: string; endDate: string; reason?: string }) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="startDate"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Start Date *
          </label>
          <input
            id="startDate"
            type="date"
            {...register("startDate")}
            className="w-full rounded-md border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="endDate"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            End Date *
          </label>
          <input
            id="endDate"
            type="date"
            {...register("endDate")}
            className="w-full rounded-md border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
          )}
        </div>
      </div>
      <div>
        <label
          htmlFor="reason"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Reason (Optional)
        </label>
        <textarea
          id="reason"
          rows={3}
          {...register("reason")}
          className="w-full rounded-md border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
          placeholder="Provide a reason for your time-off request..."
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Request
          </>
        )}
      </button>
    </form>
  );
}
