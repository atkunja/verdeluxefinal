// @ts-nocheck
import { Calendar, ChevronLeft, ChevronRight, Plus, CheckSquare, Clock as ClockIcon } from "lucide-react";
import { useState } from "react";
import { formatTime12Hour, formatDurationHours } from "~/utils/formatTime";

interface Booking {
  id: number;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  numberOfCleanersRequested?: number | null;
  client: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  cleaner: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    color: string | null;
  } | null;
  checklist?: {
    id: number;
    items: { id: number; isCompleted: boolean }[];
  } | null;
}

interface AdminCalendarViewProps {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
  onCreateBooking: () => void;
  onViewChecklist?: (bookingId: number) => void;
  onMoveBooking?: (booking: Booking, newDate: Date) => void;
  selectedBookingId?: number | null;
  onClearSelection?: () => void;
}

export function AdminCalendarView({
  bookings,
  onBookingClick,
  onCreateBooking,
  onViewChecklist,
  onMoveBooking,
  selectedBookingId = null,
  onClearSelection,
}: AdminCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [isDragging, setIsDragging] = useState(false);
  const [hoverDropInfo, setHoverDropInfo] = useState<{ key: string; label: string } | null>(null);

  const getMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
  const getMonthEnd = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const getDaysInMonth = (date: Date) => {
    const start = getMonthStart(date);
    const end = getMonthEnd(date);
    const days: Date[] = [];
    const startDay = start.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      const day = new Date(start);
      day.setDate(day.getDate() - i - 1);
      days.push(day);
    }
    for (let i = 1; i <= end.getDate(); i++) days.push(new Date(date.getFullYear(), date.getMonth(), i));
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(end);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const detroit = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Detroit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const toDetroitDateOnly = (d: Date) => {
    const parts = detroit.formatToParts(d).reduce(
      (acc, part) => {
        if (part.type === "year") acc.year = Number(part.value);
        if (part.type === "month") acc.month = Number(part.value);
        if (part.type === "day") acc.day = Number(part.value);
        return acc;
      },
      {} as { year?: number; month?: number; day?: number }
    );
    return new Date(parts.year ?? d.getFullYear(), (parts.month ?? 1) - 1, parts.day ?? d.getDate());
  };

  const getBookingsForDate = (date: Date) => {
    const targetParts = detroit.formatToParts(date).reduce(
      (acc, part) => {
        if (part.type === "year") acc.year = Number(part.value);
        if (part.type === "month") acc.month = Number(part.value);
        if (part.type === "day") acc.day = Number(part.value);
        return acc;
      },
      {} as { year?: number; month?: number; day?: number }
    );

    return bookings.filter((booking) => {
      const bookingParts = detroit.formatToParts(new Date(booking.scheduledDate)).reduce(
        (acc, part) => {
          if (part.type === "year") acc.year = Number(part.value);
          if (part.type === "month") acc.month = Number(part.value);
          if (part.type === "day") acc.day = Number(part.value);
          return acc;
        },
        {} as { year?: number; month?: number; day?: number }
      );
      return targetParts.year === bookingParts.year && targetParts.month === bookingParts.month && targetParts.day === bookingParts.day;
    });
  };

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };
  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();

  const days = getDaysInMonth(currentDate);
  const monthName = new Intl.DateTimeFormat("en-US", { timeZone: "America/Detroit", month: "long" }).format(currentDate);
  const year = currentDate.getFullYear();

  const weekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      return d;
    });
  };

  const getBookingTimeFromDrop = (
    booking: Booking,
    targetDate: Date,
    event?: React.DragEvent<HTMLDivElement>
  ) => {
    if (!event || viewMode === "month") {
      if (booking.scheduledTime) {
        const [hours, minutes] = booking.scheduledTime.split(":").map(Number);
        const date = new Date(targetDate);
        date.setHours(hours || 0, minutes || 0, 0, 0);
        return date;
      }
      return targetDate;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height));
    const hoursFromStart = y / 64;
    const baseHour = 6;
    const rawMinutes = (hoursFromStart % 1) * 60;
    const snappedMinutes = Math.round(rawMinutes / 15) * 15;
    let hour = baseHour + Math.floor(hoursFromStart);
    let minutes = snappedMinutes;
    if (minutes === 60) {
      hour += 1;
      minutes = 0;
    }
    hour = Math.min(Math.max(hour, 6), 20);

    const date = new Date(targetDate);
    date.setHours(hour, minutes, 0, 0);
    return date;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetDate: Date) => {
    e.preventDefault();
    const bookingId = Number(e.dataTransfer.getData("bookingId"));
    if (!bookingId || !onMoveBooking) return;
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    setIsDragging(false);
    setHoverDropInfo(null);
    onMoveBooking(booking, getBookingTimeFromDrop(booking, targetDate, e));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, bookingId: number) => {
    e.dataTransfer.setData("bookingId", bookingId.toString());
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setHoverDropInfo(null);
  };

  const hours = Array.from({ length: 14 }).map((_, idx) => 6 + idx); // 6am-8pm
  const formatHourLabel = (h: number) => {
    const date = new Date();
    date.setHours(h, 0, 0, 0);
    return formatTime12Hour(date.toISOString().slice(11, 16));
  };

  const displayDuration = (booking: Booking) => {
    const cleaners = booking.numberOfCleanersRequested && booking.numberOfCleanersRequested > 0 ? booking.numberOfCleanersRequested : 1;
    return booking.durationHours ? formatDurationHours(booking.durationHours / cleaners) : "";
  };

  const handleDragOverTime = (event: React.DragEvent<HTMLDivElement>, targetDate: Date) => {
    if (!isDragging) return;
    const bookingId = Number(event.dataTransfer.getData("bookingId"));
    if (!bookingId || viewMode === "month") return;
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    const dt = getBookingTimeFromDrop(booking, targetDate, event);
    const label = formatTime12Hour(dt.toTimeString().slice(0, 5));
    setHoverDropInfo({ key: targetDate.toDateString(), label });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-primary text-white p-4 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                {monthName} {year}
              </h2>
              <p className="text-xs sm:text-sm text-white/80">Tap/drag to reschedule</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={previousMonth} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors border border-white/10">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors border border-white/10">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="ml-2 bg-white/10 rounded-lg flex overflow-hidden border border-white/10">
              {(["month", "week", "day"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 text-sm font-semibold transition-colors ${
                    viewMode === mode ? "bg-white text-primary" : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={onCreateBooking}
              className="ml-2 sm:ml-4 flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors font-semibold border border-white/20 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Booking
            </button>
          </div>
        </div>
      </div>
      {isDragging && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex items-center justify-between">
          <span>Drop on a date to move. You’ll choose “this occurrence” or “entire series”.</span>
          <button className="text-amber-700 underline text-xs" onClick={() => setIsDragging(false)}>
            Got it
          </button>
        </div>
      )}

      <div className="p-4">
        {viewMode === "month" && (
          <>
            <div className="grid grid-cols-7 gap-[6px] mb-1.5">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1.5 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-[6px]">
              {days.map((day, index) => {
                const dayBookings = getBookingsForDate(toDetroitDateOnly(day));
                const isCurrentMonthDay = isCurrentMonth(day);
                const isTodayDay = isToday(day);
                const busyLevel =
                  dayBookings.length >= 5
                    ? "busy"
                    : dayBookings.length >= 3
                    ? "mid"
                    : dayBookings.length > 0
                    ? "light"
                    : "free";
                return (
                  <div
                    key={index}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, day)}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) onClearSelection?.();
                    }}
                    className={`min-h-[110px] border rounded-lg p-2 ${
                      isCurrentMonthDay ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100"
                    } ${isTodayDay ? "ring-2 ring-primary ring-offset-1" : ""} hover:shadow-sm transition`}
                  >
                    <div
                      className={`flex items-center justify-between text-sm font-semibold mb-2 ${
                        isCurrentMonthDay ? "text-gray-900" : "text-gray-400"
                      } ${isTodayDay ? "text-primary" : ""}`}
                    >
                      <span>{day.getDate()}</span>
                      {busyLevel !== "free" && (
                        <span
                          className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            busyLevel === "busy"
                              ? "bg-red-100 text-red-700"
                              : busyLevel === "mid"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {dayBookings.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map((booking) => {
                        const isSelected = selectedBookingId === booking.id;
                        const statusTone = (booking as any).status === "CANCELLED"
                          ? "bg-red-50 border-red-200 text-red-700"
                          : (booking as any).status === "COMPLETED"
                          ? "bg-gray-50 border-gray-200 text-gray-700"
                          : (booking as any).status === "PENDING"
                          ? "bg-amber-50 border-amber-200 text-amber-800"
                          : "bg-primary/5 border-primary/15 text-gray-900";
                        return (
                          <div
                            key={booking.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, booking.id)}
                            onDragEnd={handleDragEnd}
                            className={`p-2 rounded-lg cursor-pointer transition-all border ${statusTone} ${
                              isSelected ? "ring-2 ring-primary shadow-md" : "hover:bg-primary/10"
                            }`}
                            style={{
                              borderLeft: `4px solid ${booking.cleaner?.color ?? "#163022"}`,
                            }}
                            onClick={() => onBookingClick(booking)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">
                                  {booking.client.firstName} {booking.client.lastName}
                                </p>
                                <p className="text-xs text-gray-600 truncate">
                                  {booking.scheduledTime ? formatTime12Hour(booking.scheduledTime) : "—"} • {booking.serviceType}
                                </p>
                                {booking.durationHours && (
                                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                    <ClockIcon className="w-3 h-3" />
                                    {displayDuration(booking)}
                                    {booking.numberOfCleanersRequested && booking.numberOfCleanersRequested > 1
                                      ? ` • ${booking.numberOfCleanersRequested} cleaners`
                                      : ""}
                                  </p>
                                )}
                              </div>
                              {booking.checklist && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewChecklist?.(booking.id);
                                  }}
                                  className="p-1 rounded-md text-primary hover:bg-primary/10"
                                >
                                  <CheckSquare className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {dayBookings.length > 3 && (
                        <div className="text-[11px] text-gray-500 italic">+{dayBookings.length - 3} more</div>
                      )}
                      {dayBookings.length === 0 && <div className="text-xs text-gray-400 italic">No bookings</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viewMode === "week" && (
          <div className="space-y-2">
            <div className="grid grid-cols-8 gap-2">
              <div className="text-xs font-semibold text-gray-600 text-right pr-2">Time</div>
              {weekDays().map((d, idx) => (
                <div key={idx} className="text-xs font-semibold text-center text-gray-700">
                  {toDetroitDateOnly(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-8 gap-2">
              <div className="space-y-2">
                {hours.map((h) => (
                  <div key={h} className="h-16 text-xs text-gray-500 text-right pr-2">
                    {formatHourLabel(h)}
                  </div>
                ))}
              </div>
              {weekDays().map((day, colIdx) => (
              <div
                key={colIdx}
                className="relative border border-gray-100 rounded-lg min-h-[900px] bg-gray-50"
                onDragOver={(e) => {
                  e.preventDefault();
                  handleDragOverTime(e, day);
                }}
                onDrop={(e) => handleDrop(e, day)}
              >
                {isDragging && hoverDropInfo?.key === day.toDateString() && (
                  <div className="absolute top-2 right-2 text-[11px] text-gray-700 bg-white/90 px-2 py-1 rounded border border-gray-200 shadow-sm pointer-events-none">
                    Drop → {hoverDropInfo.label}
                  </div>
                )}
                {hours.map((h) => (
                  <div key={h} className="absolute left-0 right-0 border-t border-gray-200" style={{ top: `${(h - 6) * 64}px` }} />
                ))}
                  {getBookingsForDate(toDetroitDateOnly(day)).map((booking) => {
                    const start = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
                    const durationHours = booking.durationHours || 1;
                    const startHour = start.getHours() + start.getMinutes() / 60;
                    const top = (startHour - 6) * 64;
                    const height = Math.max(64, durationHours * 64);
                    return (
                      <div
                        key={booking.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, booking.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onBookingClick(booking)}
                        className="absolute left-1 right-1 rounded-lg border-l-4 bg-white shadow-sm p-2 cursor-pointer"
                        style={{
                          top,
                          height,
                          borderLeftColor: booking.cleaner?.color || "#163022",
                        }}
                      >
                        <p className="text-xs font-semibold text-gray-900 truncate">{booking.serviceType}</p>
                        <p className="text-[11px] text-gray-600 truncate">
                          {formatTime12Hour(booking.scheduledTime)} • {displayDuration(booking)}
                          {booking.numberOfCleanersRequested && booking.numberOfCleanersRequested > 1 ? ` • ${booking.numberOfCleanersRequested} cleaners` : ""}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">{booking.client.firstName} {booking.client.lastName}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === "day" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {currentDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1))}
                  className="px-3 py-2 border rounded-lg text-sm text-gray-700"
                >
                  Prev
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 border rounded-lg text-sm text-gray-700">
                  Today
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1))}
                  className="px-3 py-2 border rounded-lg text-sm text-gray-700"
                >
                  Next
                </button>
              </div>
            </div>

            <div
              className="relative border border-gray-100 rounded-lg min-h-[900px] bg-gray-50"
              onDragOver={(e) => {
                e.preventDefault();
                handleDragOverTime(e, currentDate);
              }}
              onDrop={(e) => handleDrop(e, currentDate)}
            >
              {isDragging && hoverDropInfo?.key === currentDate.toDateString() && (
                <div className="absolute top-2 right-2 text-[11px] text-gray-700 bg-white/90 px-2 py-1 rounded border border-gray-200 shadow-sm pointer-events-none">
                  Drop → {hoverDropInfo.label}
                </div>
              )}
              {hours.map((h) => (
                <div key={h} className="absolute left-0 right-0 border-t border-gray-200" style={{ top: `${(h - 6) * 64}px` }} />
              ))}
              {getBookingsForDate(toDetroitDateOnly(currentDate)).map((booking) => {
                const start = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
                const durationHours = booking.durationHours || 1;
                const startHour = start.getHours() + start.getMinutes() / 60;
                const top = (startHour - 6) * 64;
                const height = Math.max(64, durationHours * 64);
                return (
                  <div
                    key={booking.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, booking.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onBookingClick(booking)}
                    className="absolute left-1 right-1 rounded-lg border-l-4 bg-white shadow-sm p-3 cursor-pointer"
                    style={{
                      top,
                      height,
                      borderLeftColor: booking.cleaner?.color || "#163022",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{booking.serviceType}</p>
                      <span className="text-[11px] text-gray-500">
                        {displayDuration(booking)}
                        {booking.numberOfCleanersRequested && booking.numberOfCleanersRequested > 1 ? ` • ${booking.numberOfCleanersRequested} cleaners` : ""}
                      </span>
                    </div>
                        <p className="text-xs text-gray-600 truncate">
                          {formatTime12Hour(booking.scheduledTime)} • {displayDuration(booking)}
                          {booking.numberOfCleanersRequested && booking.numberOfCleanersRequested > 1 ? ` • ${booking.numberOfCleanersRequested} cleaners` : ""}
                        </p>
                    <p className="text-xs text-gray-500 truncate">
                      {booking.client.firstName} {booking.client.lastName}
                    </p>
                  </div>
                );
              })}
              {getBookingsForDate(currentDate).length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">No bookings for this day.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
