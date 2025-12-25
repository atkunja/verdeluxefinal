
import { createFileRoute } from "@tanstack/react-router";
import { ReactNode, useEffect, useMemo, useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminShell } from "~/components/admin/AdminShell";
import { CancelBookingModal } from "~/components/admin/CancelBookingModal";
import { MoveBookingModal } from "~/components/admin/MoveBookingModal";
import { ActionConfirmationModal } from "~/components/admin/ActionConfirmationModal";
import { CreateBookingModal } from "~/components/admin/CreateBookingModal";
import { BookingEvent, ChargeRow } from "~/mocks/adminPortal";
import { listBookings, listCharges, chargeBooking, preChargeBooking, retryCharge, refundCharge } from "~/api/adminPortal";
import { CalendarClock, CreditCard, MapPin, User, Eye, EyeOff, UserPlus, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useTRPC } from "~/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import { LiveStatusTracker } from "~/components/admin/LiveStatusTracker";
import { CleanerAssignmentModal } from "~/components/admin/CleanerAssignmentModal";
import { BookingEventTooltip } from "~/components/BookingEventTooltip";



export const Route = createFileRoute("/admin-portal/bookings")({
  component: BookingsPage,
});

type ChargeTab = "pending" | "holds" | "declined" | "all";
type CalendarView = "month" | "week" | "day";
type BookingAction =
  | "edit"
  | "cancel"
  | "assign"
  | "add-card-link"
  | "resend-receipt"
  | "send-invoice"
  | "time-log"
  | "payment-log"
  | "refund"
  | "retry-payment";


interface ActionPreferences {
  notifyEmail: boolean;
  notifySms: boolean;
  cancellationFeeApplied: boolean;
  cancellationFeeAmount?: number;
}

function BookingsPage() {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [activeBooking, setActiveBooking] = useState<BookingEvent | null>(null);
  const [providerFilter, setProviderFilter] = useState<string>("ALL");
  const [chargeTab, setChargeTab] = useState<ChargeTab>("pending");
  const [bookingSearch, setBookingSearch] = useState("");
  const [chargeSearch, setChargeSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [view, setView] = useState<CalendarView>("month");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const trpc = useTRPC();
  const cancelBookingMutation = useMutation(trpc.updateBookingAdmin.mutationOptions());
  const receiptMutation = useMutation(trpc.sendBookingReceipt.mutationOptions());
  const invoiceMutation = useMutation(trpc.sendBookingInvoice.mutationOptions());
  const setupIntentMutation = useMutation(trpc.stripe.createSetupIntent.mutationOptions());
  const capturePaymentMutation = useMutation(trpc.stripe.capturePayment.mutationOptions());
  const refundPaymentMutation = useMutation(trpc.stripe.refundPayment.mutationOptions());
  const [actionPrefs, setActionPrefs] = useState<ActionPreferences>({
    notifyEmail: true,
    notifySms: false,
    cancellationFeeApplied: false,
    cancellationFeeAmount: undefined,
  });
  const [showLiveTracker, setShowLiveTracker] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<BookingEvent | null>(null);
  const [tooltipTarget, setTooltipTarget] = useState<HTMLElement | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);


  const [actionModal, setActionModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
    variant?: "info" | "danger" | "warning" | "success";
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: async () => { },
  });
  const [pendingMove, setPendingMove] = useState<{ id: string; date: string; isRecurring: boolean } | null>(null);
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery(trpc.getAllBookingsAdmin.queryOptions({}, { enabled: true }));
  const chargesQuery = useQuery(trpc.payments.listCharges.queryOptions(undefined, { enabled: true }));
  const holdsQuery = useQuery(trpc.payments.listHolds.queryOptions(undefined, { enabled: true }));

  useEffect(() => {
    if ((bookingsQuery.data as any)?.bookings) {
      setEvents(
        (bookingsQuery.data as any).bookings.map((b: any) => ({

          id: b.id.toString(),
          customer: `${b.client?.firstName ?? ""} ${b.client?.lastName ?? ""} `.trim() || b.client?.email || "Client",
          contact: b.client?.phone || b.client?.email || "",
          serviceType: b.serviceType,
          scheduledDate: new Date(b.scheduledDate).toISOString().slice(0, 10),
          scheduledTime: b.scheduledTime,
          provider: `${b.cleaner?.firstName ?? ""} ${b.cleaner?.lastName ?? ""} `.trim() || (b.status === "PENDING" ? "UNASSIGNED" : "Cleaner"),
          providerColor: b.cleaner?.color || (b.status === "PENDING" ? "#64748b" : "#163022"),
          status: b.status,

          location: b.address,
          price: b.finalPrice || 0,
          paymentStatus: (b.stripePayments?.[0]?.status as any) || "pending",
          durationHours: b.durationHours || undefined,
          paymentIntentId: (b as any).paymentIntentId,
          cleaners: b.cleaners?.map((c: any) => ({
            name: `${c.cleaner?.firstName ?? ""} ${c.cleaner?.lastName ?? ""} `.trim(),
            color: c.cleaner?.color || "#163022",
          })),
        }))
      );
    } else {
      listBookings().then(setEvents);
    }
  }, [bookingsQuery.data]);

  useEffect(() => {
    if (chargesQuery.data || holdsQuery.data) {
      const normalized: ChargeRow[] = [];
      (holdsQuery.data as any ?? []).forEach((h: any) =>
        normalized.push({
          id: h.id,
          type: "hold",
          serviceDate: h.created ? new Date(h.created).toISOString().slice(0, 10) : "",
          serviceTime: "",
          customer: { name: "", email: "", phone: "" },
          bookingId: h.bookingId || "",
          cleaner: "",
          location: "",
          amount: h.amount,
          paymentMethod: h.paymentMethod || "",
          status: h.status,
          paymentIntentId: h.paymentIntentId,
        })
      );
      (chargesQuery.data as any ?? []).forEach((c: any) =>
        normalized.push({
          id: c.id,
          type: "paid",
          serviceDate: c.created ? new Date(c.created).toISOString().slice(0, 10) : "",
          serviceTime: "",
          customer: { name: "", email: "", phone: "" },
          bookingId: c.bookingId || "",
          cleaner: "",
          location: "",
          amount: c.amount,
          paymentMethod: c.paymentMethod || "",
          status: c.status,
          paymentIntentId: c.paymentIntentId,
        })
      );
      setCharges(normalized);
    } else {
      listCharges().then(setCharges);
    }
  }, [chargesQuery.data, holdsQuery.data]);


  const providers = useMemo(() => Array.from(new Set(events.map((e) => e.provider))), [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesProvider = providerFilter === "ALL" || event.provider === providerFilter;
      if (!matchesProvider) return false;
      const term = bookingSearch.toLowerCase();
      const matchesSearch =
        event.customer.toLowerCase().includes(term) ||
        event.contact.toLowerCase().includes(term) ||
        event.location.toLowerCase().includes(term);
      return matchesSearch && event.status !== "CANCELLED";
    });
  }, [events, providerFilter, bookingSearch]);

  const daysThisMonth = useMemo(() => {
    const now = new Date();
    const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const start = new Date(startOfMonthDate);
    start.setDate(startOfMonthDate.getDate() - startOfMonthDate.getDay());
    const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const end = new Date(endOfMonthDate);
    end.setDate(endOfMonthDate.getDate() + 6);
    const days: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, []);

  const filteredCharges = useMemo(() => {
    let rows = charges;
    if (chargeTab === "pending") rows = charges.filter((c) => c.type === "pending");
    if (chargeTab === "holds") rows = charges.filter((c) => c.type === "hold");
    if (chargeTab === "declined") rows = charges.filter((c) => c.type === "declined");
    if (startDate) rows = rows.filter((c) => c.serviceDate >= startDate);
    if (endDate) rows = rows.filter((c) => c.serviceDate <= endDate);
    if (chargeSearch) {
      const term = chargeSearch.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.customer.name.toLowerCase().includes(term) ||
          c.customer.email.toLowerCase().includes(term) ||
          c.customer.phone.toLowerCase().includes(term) ||
          c.location.toLowerCase().includes(term)
      );
    }
    return rows;
  }, [charges, chargeTab, startDate, endDate, chargeSearch]);

  const moveBooking = async (id: string, newDate: string, scope: "single" | "series" = "single") => {
    try {
      await cancelBookingMutation.mutateAsync({
        bookingId: Number(id),
        scheduledDate: new Date(newDate).toISOString(),
        scope,
      });
      toast.success(`Booking moved to ${newDate} `);
      queryClient.invalidateQueries(trpc.getAllBookingsAdmin.queryOptions({}, { enabled: true }).queryKey as any);
    } catch (err: any) {
      toast.error(err.message || "Failed to move booking");
    }
  };

  const handleMovePrompt = (id: string, date: string) => {
    const booking = events.find(e => e.id === id);
    if (!booking) return;

    setPendingMove({ id, date, isRecurring: !!booking.serviceType && booking.serviceType !== "ONE_TIME" });
    setMoveModalOpen(true);
  };

  const handleChargeAction = async (
    action: "charge" | "precharge" | "retry" | "refund",
    row: ChargeRow
  ) => {
    const titles: Record<typeof action, string> = {
      charge: "Capture Payment",
      precharge: "Authorize Payment",
      retry: "Retry Payment",
      refund: "Refund Payment",
    };

    const messages: Record<typeof action, string> = {
      charge: `Are you sure you want to capture the remaining $${row.amount.toFixed(2)} for ${row.customer.name} ? `,
      precharge: `Authorize a card hold of $${row.amount.toFixed(2)} for ${row.customer.name} ? `,
      retry: `Retry the failed payment of $${row.amount.toFixed(2)} for ${row.customer.name} ? `,
      refund: `Proceed with a refund of $${row.amount.toFixed(2)} to ${row.customer.name}?`,
    };

    setActionModal({
      open: true,
      title: titles[action],
      variant: action === "refund" ? "warning" : "info",
      description: messages[action],
      onConfirm: async () => {
        try {
          if (action === "charge") await chargeBooking(row.id);
          if (action === "precharge") await preChargeBooking(row.id);
          if (action === "retry") await retryCharge(row.id);
          if (action === "refund") await refundCharge(row.id);
          toast.success("Action processed");
          queryClient.invalidateQueries({ queryKey: trpc.payments.listCharges.queryKey() });
          queryClient.invalidateQueries({ queryKey: trpc.payments.listHolds.queryKey() });
        } catch (err: any) {
          toast.error(err.message || "Action failed");
        }
      }
    });
  };

  return (
    <AdminShell
      title="Bookings"
      subtitle="Calendar and charges."
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1 text-sm">
            {(["month", "week", "day"] as CalendarView[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`rounded-lg px-3 py-1.5 font-semibold ${view === mode ? "bg-[#163022] text-white" : "text-gray-700"
                  }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowLiveTracker(!showLiveTracker)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow transition-all ${showLiveTracker
              ? "bg-primary text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
          >
            {showLiveTracker ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Live Status
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="rounded-xl bg-[#163022] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#0f241a]"
          >
            New Booking
          </button>
        </div>
      }
    >
      <div className="relative flex flex-col gap-6 lg:flex-row h-full">
        <div className="flex-1 overflow-hidden">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Providers</label>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="ALL">All</option>
                {providers.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              placeholder="Search bookings"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* MaahikT-style gradient header */}
              <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <CalendarClock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">Calendar</div>
                      <div className="text-xs text-white/70 capitalize">{view} view</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                {view === "month" && (
                  <div className="grid grid-cols-7 gap-2 text-sm">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dow) => (
                      <div key={dow} className="text-center text-xs font-semibold text-gray-500">
                        {dow}
                      </div>
                    ))}
                    {daysThisMonth.map((day) => {
                      const dateStr = day.toISOString().slice(0, 10);
                      const dayEvents = filteredEvents.filter((ev) => ev.scheduledDate === dateStr);
                      return (
                        <div
                          key={day.toISOString()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            const id = e.dataTransfer.getData("text/plain");
                            if (id) handleMovePrompt(id, dateStr);
                          }}
                          className={`min-h-[120px] rounded-xl border ${selectedDay === dateStr ? "border-[#163022]" : "border-gray-200"} bg-[#f9fafb] p-2`}
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                            <span>{day.getDate()}</span>
                            <button
                              className="text-[10px] text-gray-500 hover:text-[#163022]"
                              onClick={() => setSelectedDay(dateStr)}
                            >
                              Select
                            </button>
                          </div>
                          <div className="mt-1 space-y-2">
                            {dayEvents.map((event) => (
                              <button
                                key={event.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, event.id)}
                                onClick={() => setActiveBooking(event)}
                                onMouseEnter={(e) => {
                                  if (hoverTimeoutRef.current) {
                                    clearTimeout(hoverTimeoutRef.current);
                                    hoverTimeoutRef.current = null;
                                  }
                                  setHoveredEvent(event);
                                  setTooltipTarget(e.currentTarget);
                                }}
                                onMouseLeave={() => {
                                  if (hoverTimeoutRef.current) {
                                    clearTimeout(hoverTimeoutRef.current);
                                  }
                                  hoverTimeoutRef.current = window.setTimeout(() => {
                                    setHoveredEvent(null);
                                    setTooltipTarget(null);
                                  }, 200);
                                }}
                                className="block w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-left text-xs shadow hover:border-[#163022] hover:shadow-md transition-all"
                                style={{
                                  borderLeftWidth: '3px',
                                  borderLeftColor: event.providerColor,
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-gray-800">{event.scheduledTime}</span>
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: event.providerColor }}
                                  />
                                </div>
                                <div className="truncate text-gray-700">{event.customer}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {view !== "month" && (
                  <div className="overflow-x-auto">
                    <div className="min-w-[980px]">
                      <div className="grid grid-cols-[80px,1fr] gap-2">
                        <div className="text-[11px] text-gray-500">
                          {getTimeSlots().map((slot) => (
                            <div key={slot} className="h-10 border-b border-dashed border-gray-200 pr-2 text-right leading-10">
                              {slot}
                            </div>
                          ))}
                        </div>
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${view === "week" ? 7 : 1}, minmax(0, 1fr))` }}>
                          {(view === "week" ? getWeekDays() : getSingleDay()).map((day) => {
                            const dateStr = day.toISOString().slice(0, 10);
                            const dayEvents = filteredEvents.filter((ev) => ev.scheduledDate === dateStr);
                            return (
                              <div key={dateStr} className="rounded-xl border border-gray-200 bg-[#f9fafb] p-2">
                                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-700">
                                  <span>{day.toDateString()}</span>
                                  <button
                                    className="text-[10px] text-gray-500 hover:text-[#163022]"
                                    onClick={() => setSelectedDay(dateStr)}
                                  >
                                    Select
                                  </button>
                                </div>
                                <div className="relative h-[920px]">
                                  {dayEvents.map((event) => {
                                    const top = getMinutesFromStart(event.scheduledTime);
                                    const height = Math.max(50, (event.durationHours || 1) * 60);
                                    return (
                                      <div
                                        key={event.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, event.id)}
                                        onClick={() => setActiveBooking(event)}
                                        className="absolute left-1 right-1 rounded-lg border border-gray-200 bg-white p-2 shadow hover:border-[#163022]"
                                        style={{
                                          top,
                                          height,
                                        }}
                                      >
                                        <div className="flex items-center justify-between text-[11px]">
                                          <span className="font-semibold text-gray-800">
                                            {event.scheduledTime} • {formatDurationLabel(event.durationHours || 1)}
                                            {event.cleaners?.length && event.cleaners.length > 1
                                              ? ` (≈ ${formatDurationLabel((event.durationHours || 1) / event.cleaners.length)} each)`
                                              : ""}
                                          </span>
                                          <span
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: event.providerColor }}
                                          />
                                        </div>
                                        <div className="text-sm font-semibold text-[#0f172a]">{event.customer}</div>
                                        <div className="text-[11px] text-gray-500">
                                          {event.serviceType} • {event.location}
                                        </div>
                                        {event.cleaners && event.cleaners.length > 0 && (
                                          <div className="mt-1 flex flex-wrap gap-1">
                                            {event.cleaners.map((cl) => (
                                              <span
                                                key={cl.name}
                                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                                style={{ backgroundColor: `${cl.color} 20`, color: cl.color }}
                                              >
                                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cl.color }} />
                                                {cl.name}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  <div className="absolute inset-0 pointer-events-none">
                                    {getTimeSlots().map((slot, idx) => (
                                      <div key={slot} className="absolute left-0 right-0 border-b border-dashed border-gray-200" style={{ top: idx * 40 + 40 }} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-[#0f172a]">Charges</div>
                  <div className="text-xs text-gray-500">Payments & holds</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {([
                  ["pending", "Pending Charges"],
                  ["holds", "Card Hold(s)"],
                  ["declined", "Declined"],
                  ["all", "All Charges"],
                ] as const).map(([tabKey, label]) => (
                  <button
                    key={tabKey}
                    onClick={() => setChargeTab(tabKey)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${chargeTab === tabKey ? "bg-[#163022] text-white" : "bg-[#f5f3ec] text-gray-700"
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-lg border border-gray-200 px-2 py-1"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-lg border border-gray-200 px-2 py-1"
                  />
                  <input
                    value={chargeSearch}
                    onChange={(e) => setChargeSearch(e.target.value)}
                    placeholder="Search name/email/phone/address"
                    className="flex-1 rounded-lg border border-gray-200 px-2 py-1"
                  />
                </div>
                <div className="max-h-[560px] overflow-y-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="sticky top-0 bg-white text-[11px] text-gray-600">
                      <tr>
                        <th className="px-2 py-2">Service</th>
                        <th className="px-2 py-2">Customer</th>
                        <th className="px-2 py-2">Booking</th>
                        <th className="px-2 py-2">Cleaner</th>
                        <th className="px-2 py-2">Location</th>
                        <th className="px-2 py-2 text-right">Amount</th>
                        <th className="px-2 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCharges.map((row) => (
                        <tr key={row.id} className="hover:bg-[#f9fafb]">
                          <td className="px-2 py-2">
                            <div>{row.serviceDate}</div>
                            <div className="text-[11px] text-gray-500">{row.serviceTime}</div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="font-semibold text-gray-800">{row.customer.name}</div>
                            <div className="text-[11px] text-gray-500">{row.customer.email}</div>
                            <div className="text-[11px] text-gray-500">{row.customer.phone}</div>
                          </td>
                          <td className="px-2 py-2 text-gray-700">{row.bookingId}</td>
                          <td className="px-2 py-2 text-gray-700">{row.cleaner}</td>
                          <td className="px-2 py-2 text-gray-700">{row.location}</td>
                          <td className="px-2 py-2 text-right font-semibold text-gray-800">
                            ${row.amount.toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <ChargeActions row={row} onAction={handleChargeAction} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <BookingSummaryPanel
            booking={activeBooking}
            onClose={() => setActiveBooking(null)}
            onMove={handleMovePrompt}
            onAction={(action) => {
              if (!activeBooking) return;
              if (action === "assign") {
                setAssignModalOpen(true);
                return;
              }
              if (action === "cancel") {

                setCancelModalOpen(true);
                return;
              }
              handleBookingAction(action, activeBooking, {
                cancel: cancelBookingMutation,
                receipt: receiptMutation,
                invoice: invoiceMutation,
                setupIntent: setupIntentMutation,
                capture: capturePaymentMutation,
                refund: refundPaymentMutation,
              }, actionPrefs, setActionModal);
            }}
            actionPrefs={actionPrefs}
            setActionPrefs={setActionPrefs}
            mutations={{
              cancel: cancelBookingMutation,
              receipt: receiptMutation,
              invoice: invoiceMutation,
              setupIntent: setupIntentMutation,
              capture: capturePaymentMutation,
              refund: refundPaymentMutation,
            }}
            setActionModal={setActionModal}
          />

          <CleanerAssignmentModal
            isOpen={assignModalOpen}
            onClose={() => setAssignModalOpen(false)}
            bookingId={activeBooking ? Number(activeBooking.id) : null}
            currentCleanerIds={(activeBooking as any)?.cleanerIds || []}
          />


          <CancelBookingModal
            isOpen={cancelModalOpen}
            onClose={() => setCancelModalOpen(false)}
            booking={activeBooking ? {
              id: activeBooking.id,
              customerName: activeBooking.customer,
              price: activeBooking.price,
              date: activeBooking.scheduledDate,
              time: activeBooking.scheduledTime,
            } : null}
            onConfirm={async (opts) => {
              if (!activeBooking) return;
              await cancelBookingMutation.mutateAsync({
                bookingId: Number(activeBooking.id),
                status: "CANCELLED",
                scope: opts.scope,
                cancellationFeeApplied: opts.applyFee,
                cancellationFeeAmount: opts.feeAmount,
                notifyEmail: opts.notifyEmail,
                notifySms: opts.notifySms,
              });
              toast.success("Booking cancelled successfully");
              // Refresh data
              queryClient.invalidateQueries(trpc.getAllBookingsAdmin.queryOptions({}, { enabled: true }).queryKey as any);
              setActiveBooking(null);
            }}
          />

          <MoveBookingModal
            isOpen={moveModalOpen}
            onClose={() => setMoveModalOpen(false)}
            booking={pendingMove ? {
              ...pendingMove,
              customerName: events.find(e => e.id === pendingMove.id)?.customer || "Client",
              isRecurring: pendingMove.isRecurring
            } : null}
            onConfirm={async (scope) => {
              if (pendingMove) {
                await moveBooking(pendingMove.id, pendingMove.date, scope);
              }
            }}
          />

          <ActionConfirmationModal
            isOpen={actionModal.open}
            onClose={() => setActionModal(prev => ({ ...prev, open: false }))}
            title={actionModal.title}
            description={actionModal.description}
            variant={actionModal.variant}
            onConfirm={actionModal.onConfirm}
          />
          <CreateBookingModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
        </div>

        {showLiveTracker && (
          <div className="w-full lg:w-80 flex-shrink-0 animate-in slide-in-from-right duration-300">
            <LiveStatusTracker />
          </div>
        )}

        <div className="w-full lg:w-72 flex-shrink-0">
          <UnassignedList
            bookings={events.filter(e => e.status === "PENDING")}
            onSelect={(b) => setActiveBooking(b)}
          />
        </div>
      </div>

      {/* Booking Tooltip */}
      {hoveredEvent && tooltipTarget && (
        <BookingEventTooltip
          event={hoveredEvent}
          targetElement={tooltipTarget}
          visible={true}
        />
      )}
    </AdminShell>
  );
}

function getWeekDays() {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(start);
    d.setDate(start.getDate() + idx);
    return d;
  });
}

function getSingleDay() {
  return [new Date()];
}

function getTimeSlots() {
  const slots: string[] = [];
  for (let hour = 6; hour <= 21; hour++) {
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = ((hour + 11) % 12) + 1;
    slots.push(`${displayHour}:00 ${suffix} `);
  }
  return slots;
}

function formatDurationLabel(hours: number) {
  /* 
    User requested "2h 30m" instead of "2.5h" or "2 Hr 30 Min"
  */
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m} m`;
  if (h > 0) return `${h} h`;
  return `${m} m`;
}

function getMinutesFromStart(time: string) {
  if (!time) return 0;
  const [raw, meridiem] = time.split(" ");
  if (!raw) return 0;
  const [hStr, mStr] = raw.split(":");
  let hours = Number(hStr);
  const minutes = Number(mStr || 0);
  if (meridiem?.toLowerCase() === "pm" && hours !== 12) hours += 12;
  if (meridiem?.toLowerCase() === "am" && hours === 12) hours = 0;
  const startOfDay = 6 * 60; // 6 AM baseline
  return Math.max(0, hours * 60 + minutes - startOfDay);
}

async function handleBookingAction(
  action: BookingAction,
  booking: BookingEvent,
  mutations?: {
    cancel?: any;
    receipt?: any;
    invoice?: any;
    setupIntent?: any;
    capture?: any;
    refund?: any;
  },
  prefs?: ActionPreferences,
  setActionModal?: (data: any) => void
) {
  const titles: Record<BookingAction, string> = {
    edit: "Open Booking Editor",
    cancel: "Cancel Booking",
    "add-card-link": "Send Setup Link",
    "resend-receipt": "Resend Receipt",
    "send-invoice": "Send Invoice",
    "time-log": "View Time Log",
    "payment-log": "View Payment Log",
    refund: "Refund Booking",
    "retry-payment": "Retry Payment",
    assign: "Assign Cleaner(s)",
  };


  const prompts: Record<BookingAction, string> = {
    edit: `Would you like to open the full editor for ${booking.customer} ? `,
    cancel: "Cancel booking? You can choose all or single in the next step.",
    "add-card-link": `Send a secure link to ${booking.customer} to add or update their payment method ? `,
    "resend-receipt": `Would you like to resend the latest receipt to ${booking.customer}?`,
    "send-invoice": `Would you like to send a manual invoice to ${booking.customer}?`,
    "time-log": `View clock -in/out history and duration logs for ${booking.customer}?`,
    "payment-log": `View detailed transaction logs and Stripe events for ${booking.customer}?`,
    refund: `Are you sure you want to refund the payment for ${booking.customer}?`,
    "retry-payment": `Attempt to process the pending payment for ${booking.customer} again?`,
    assign: `Assigned cleaner(s) to this booking?`,
  };


  if (action === "cancel") return; // Handled by separate modal

  if (!setActionModal) {
    if (!window.confirm(prompts[action])) return;
  } else {
    setActionModal({
      open: true,
      title: titles[action],
      description: prompts[action],
      variant: action === "refund" ? "warning" : "info",
      onConfirm: async () => {
        try {
          const bookingIdNum = Number(booking.id);
          const paymentIntentId = booking.paymentIntentId || (Number.isFinite(bookingIdNum) ? String(bookingIdNum) : undefined);

          if (action === "refund") {
            const reason = window.prompt("Refund reason?") || undefined;
            if (mutations?.refund) {
              await (mutations.refund as any).mutateAsync({ paymentIntentId: paymentIntentId || String(bookingIdNum), reason });
            } else {
              throw new Error("Refund handler unavailable");
            }
            toast.success("Refund processed");
            return;
          }
          if (action === "retry-payment") {
            if (mutations?.capture) {
              await (mutations.capture as any).mutateAsync({ paymentIntentId: paymentIntentId || String(bookingIdNum) });
            } else {
              throw new Error("Retry handler unavailable");
            }
            toast.success("Retrying payment");
            return;
          }
          if (action === "add-card-link") {
            if (mutations?.setupIntent) {
              await (mutations.setupIntent as any).mutateAsync({ bookingId: bookingIdNum });
            } else {
              throw new Error("Setup intent handler unavailable");
            }
            toast.success("Add-card link sent");
            return;
          }
          if (action === "resend-receipt") {
            if (mutations?.receipt) {
              await (mutations.receipt as any).mutateAsync({ bookingId: bookingIdNum });
            } else {
              throw new Error("Receipt handler unavailable");
            }
            toast.success("Receipt resent");
            return;
          }
          if (action === "send-invoice") {
            if (mutations?.invoice) {
              await (mutations.invoice as any).mutateAsync({ bookingId: bookingIdNum });
            } else {
              throw new Error("Invoice handler unavailable");
            }
            toast.success("Invoice sent");
            return;
          }
          if (action === "edit") {
            toast("Opening editor (Coming Soon)", { icon: "🛠️" });
            return;
          }
          if (action === "time-log" || action === "payment-log") {
            toast(`Viewing ${action} (Coming Soon)`, { icon: "📋" });
            return;
          }
          toast.success(`${action} action processed for ${booking.customer}`);
        } catch (err: any) {
          console.error(err);
          toast.error(err?.message || "Action failed");
        }
      }
    });
    return;
  }

  // action logic is completely handled inside the setActionModal callback above
}

function handleDragStart(e: React.DragEvent, id: string) {
  e.dataTransfer.setData("text/plain", id);
}

function handleDrop(e: React.DragEvent, dateStr: string, moveBooking: (id: string, newDate: string) => void) {
  const id = e.dataTransfer.getData("text/plain");
  if (!id) return;
  const changeSeries = window.confirm("Change this and future recurring bookings? Click Cancel to move only this booking.");
  const applyToAll = changeSeries;
  // In a real impl, call API with applyToAll flag.
  e.preventDefault();
  moveBooking(id, dateStr);
}

function BookingSummaryPanel({
  booking,
  onClose,
  onMove,
  onAction,
  actionPrefs,
  setActionPrefs,
}: {
  booking: BookingEvent | null;
  onClose: () => void;
  onMove: (id: string, date: string) => void;
  onAction: (action: BookingAction) => void;
  actionPrefs: ActionPreferences;
  setActionPrefs: React.Dispatch<React.SetStateAction<ActionPreferences>>;
  mutations?: any;
  setActionModal?: (data: any) => void;
}) {
  if (!booking) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30 animate-in fade-in duration-300">
      <div className="h-full w-full max-w-[420px] overflow-y-auto border-l border-gray-200 bg-white p-5 shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-[#0f172a]">Booking Summary</div>
            <div className="text-xs text-gray-500">{booking.customer}</div>
          </div>
          <button className="text-sm text-gray-500" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="space-y-3 text-sm text-gray-800">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-[#f9fafb] p-3">
            <SummaryRow label="Service">{booking.serviceType}</SummaryRow>
            <SummaryRow label="Frequency">Every Other Week</SummaryRow>
            <SummaryRow label="Length">{formatDurationLabel((booking as any).durationHours || 2)}</SummaryRow>
            <SummaryRow label="Service date">
              {booking.scheduledDate}, {booking.scheduledTime}
            </SummaryRow>
            <SummaryRow label="Assigned to">{booking.provider}</SummaryRow>
            {booking.cleaners && booking.cleaners.length > 0 && (
              <SummaryRow label="Cleaner(s)">
                <div className="flex flex-wrap gap-1 justify-end">
                  {booking.cleaners.map((cl) => (
                    <span
                      key={cl.name}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
                      style={{ backgroundColor: `${cl.color}15`, color: cl.color }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cl.color }} />
                      {cl.name}
                    </span>
                  ))}
                </div>
              </SummaryRow>
            )}
            <SummaryRow label="Location">{booking.location}</SummaryRow>
            <SummaryRow label="Payment method">
              <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">CC</span>
            </SummaryRow>
            <SummaryRow label="Payment status">
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ${booking.paymentStatus === "paid" ? "bg-green-100 text-green-700" :
                booking.paymentStatus === "pending" ? "bg-amber-100 text-amber-700" :
                  booking.paymentStatus === "declined" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                }`}>
                {booking.paymentStatus}
              </span>
            </SummaryRow>
            <SummaryRow label="Price details">${booking.price.toFixed(2)}</SummaryRow>
          </div>

          <div className="rounded-xl border border-gray-100 bg-[#f9fafb] p-3">
            <div className="text-sm font-semibold text-[#0f172a]">Payment Summary</div>
            <div className="mt-2 space-y-1 text-sm">
              <SummaryRow label="Service Total">${booking.price.toFixed(2)}</SummaryRow>
              <SummaryRow label="Discounted Total">${booking.price.toFixed(2)}</SummaryRow>
              <SummaryRow label="TOTAL">${booking.price.toFixed(2)}</SummaryRow>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-3 space-y-2">
            <div className="text-sm font-semibold text-[#0f172a]">Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton label="Edit" color="bg-blue-600 text-white" onClick={() => onAction("edit")} />
              <ActionButton label="Cancel" color="bg-red-500 text-white" onClick={() => onAction("cancel")} />
              {booking.status === "PENDING" && (
                <ActionButton
                  label="Assign Cleaner"
                  color="bg-[#163022] text-white col-span-2"
                  onClick={() => onAction("assign")}
                />
              )}

              <ActionButton label="Send “Add card” link" color="bg-pink-100 text-pink-700 border border-pink-200" onClick={() => onAction("add-card-link")} />
              <ActionButton label="Resend Receipt" color="bg-blue-100 text-blue-700 border border-blue-200" onClick={() => onAction("resend-receipt")} />
              <ActionButton label="Send Invoice" color="bg-indigo-100 text-indigo-700 border border-indigo-200" onClick={() => onAction("send-invoice")} />
              <ActionButton label="View Time Log" color="bg-orange-100 text-orange-700 border border-orange-200" onClick={() => onAction("time-log")} />
              <ActionButton label="View Payment Log" color="bg-sky-100 text-sky-700 border border-sky-200" onClick={() => onAction("payment-log")} />
              <ActionButton label="Refund" color="bg-emerald-100 text-emerald-700 border border-emerald-200" onClick={() => onAction("refund")} />
              <ActionButton label="Retry Payment" color="bg-amber-100 text-amber-700 border border-amber-200" onClick={() => onAction("retry-payment")} />
            </div>
            <div className="space-y-2 rounded-lg bg-[#f9fafb] p-3 text-xs text-gray-700">
              <div className="font-semibold text-[#0f172a]">Notifications</div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={actionPrefs.notifyEmail}
                  onChange={(e) => setActionPrefs((p) => ({ ...p, notifyEmail: e.target.checked }))}
                />
                <span>Email client on cancellation</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={actionPrefs.notifySms}
                  onChange={(e) => setActionPrefs((p) => ({ ...p, notifySms: e.target.checked }))}
                />
                <span>SMS client on cancellation</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={actionPrefs.cancellationFeeApplied}
                  onChange={(e) =>
                    setActionPrefs((p) => ({
                      ...p,
                      cancellationFeeApplied: e.target.checked,
                      cancellationFeeAmount: e.target.checked ? p.cancellationFeeAmount ?? 0 : undefined,
                    }))
                  }
                />
                <span>Apply cancellation fee</span>
              </div>
              {actionPrefs.cancellationFeeApplied && (
                <div className="flex items-center gap-2">
                  <span>Fee Amount:</span>
                  <input
                    type="number"
                    className="w-24 rounded-md border border-gray-200 px-2 py-1 text-xs"
                    value={actionPrefs.cancellationFeeAmount ?? ""}
                    onChange={(e) =>
                      setActionPrefs((p) => ({
                        ...p,
                        cancellationFeeAmount: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-3 space-y-2">
            <div className="text-sm font-semibold text-[#0f172a]">Notes</div>
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Private booking note..."
            />
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Private customer note..."
            />
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Note for service provider..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function UnassignedList({ bookings, onSelect }: { bookings: BookingEvent[], onSelect: (b: BookingEvent) => void }) {

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-bold text-[#0f172a]">Marketplace</div>
          <div className="text-xs text-gray-500">{bookings.length} unassigned</div>
        </div>
        <div className="rounded-full bg-amber-100 p-2 text-amber-600">
          <UserPlus className="h-5 w-5" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {bookings.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">
              <CheckCircle className="h-6 w-6" />
            </div>
            <p className="mt-2 text-sm text-gray-500 italic">All caught up!</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <button
              key={booking.id}
              onClick={() => onSelect(booking)}
              className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-left transition-all hover:border-[#163022] hover:bg-white hover:shadow-md group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#163022]">
                  {booking.scheduledDate}
                </span>
                <span className="text-[10px] font-semibold text-gray-500">
                  {booking.scheduledTime}
                </span>
              </div>
              <div className="mt-1 font-bold text-[#0f172a] truncate">{booking.customer}</div>
              <div className="text-[11px] text-gray-500 truncate">{booking.serviceType}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-[#163022]">${booking.price}</span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                  Assigning...
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {

  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-[#0f172a] text-right">{children}</span>
    </div>
  );
}

function ActionButton({ label, color, onClick }: { label: string; color: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-lg px-3 py-2 text-sm font-semibold ${color} shadow-sm`}>
      {label}
    </button>
  );
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f3ec] text-gray-700">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-semibold text-[#0f172a]">{children}</div>
      </div>
    </div>
  );
}

function ChargeActions({
  row,
  onAction,
}: {
  row: ChargeRow;
  onAction: (action: "charge" | "precharge" | "retry" | "refund", row: ChargeRow) => void;
}) {
  if (row.type === "pending") {
    return (
      <button
        onClick={() => onAction("charge", row)}
        className="rounded-lg bg-[#163022] px-3 py-1.5 text-xs font-semibold text-white shadow"
      >
        Charge
      </button>
    );
  }
  if (row.type === "hold") {
    return (
      <button
        onClick={() => onAction("precharge", row)}
        className="rounded-lg bg-[#163022] px-3 py-1.5 text-xs font-semibold text-white shadow"
      >
        Pre-Charge
      </button>
    );
  }
  if (row.type === "declined") {
    return (
      <button
        onClick={() => onAction("retry", row)}
        className="rounded-lg bg-[#163022] px-3 py-1.5 text-xs font-semibold text-white shadow"
      >
        Retry Payment
      </button>
    );
  }
  return (
    <button
      onClick={() => onAction("refund", row)}
      className="rounded-lg bg-[#f97316] px-3 py-1.5 text-xs font-semibold text-white shadow"
    >
      Refund
    </button>
  );
}
