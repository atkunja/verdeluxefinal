import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookingWizardProvider, useBookingDraft } from "~/components/bookings/wizard/BookingWizardProvider";
import { WizardLayout } from "~/components/bookings/wizard/WizardLayout";
import { SummaryPanel } from "~/components/bookings/wizard/SummaryPanel";
import { bookingAnalytics } from "~/components/bookings/wizard/analytics";
import { buttonPrimary, buttonSecondary } from "~/components/bookings/wizard/styles";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";

export const Route = createFileRoute("/booking-quiz/schedule")({
  component: SchedulePage,
});

const slotsByHour = [
  "8:00 AM",
  "9:00 AM",
  "10:30 AM",
  "12:00 PM",
  "2:00 PM",
  "4:00 PM",
];

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function ScheduleContent() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { user } = useAuthStore();
  const { draft, updateDraft } = useBookingDraft();
  const [startDate, setStartDate] = React.useState(() => new Date());

  React.useEffect(() => {
    bookingAnalytics.stepViewed("time-date");
  }, []);

  const dates = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) => {
      const next = new Date(startDate);
      next.setDate(startDate.getDate() + idx);
      return next;
    });
  }, [startDate]);

  const selectedDate = (draft.schedule.dateISO ? new Date(draft.schedule.dateISO) : dates[0]) as Date;

  const dateStr = selectedDate.toISOString().split("T")[0] as string;
  const availabilityQuery = useQuery({
    ...trpc.booking.getQuizAvailability.queryOptions({
      date: dateStr,
    }),
    enabled: Boolean(selectedDate),
  });

  const slots = React.useMemo(() => {
    if (availabilityQuery.data?.isFullyBooked) return [];
    const day = selectedDate.getDay();
    if (day === 0 || day === 6) return slotsByHour.slice(1, 4);
    if (selectedDate.getDate() % 5 === 0) return [];
    return slotsByHour;
  }, [availabilityQuery.data, selectedDate]);

  return (
    <WizardLayout step={2} summary={<SummaryPanel draft={draft} />}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Select your time</h1>
            <p className="text-sm text-[#5c5a55]">Pick a date and time that works for you.</p>
          </div>
          <button className="rounded-full border border-[#e3ded2] bg-white p-2" type="button">

          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">{selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
          <div className="flex items-center gap-2">
            <button type="button" className={buttonSecondary} onClick={() => setStartDate(new Date())}>
              Today
            </button>
            <button
              type="button"
              className={buttonSecondary}
              onClick={() => {
                const next = new Date(startDate);
                next.setDate(startDate.getDate() - 7);
                setStartDate(next);
              }}
            >
              Back
            </button>
            <button
              type="button"
              className={buttonSecondary}
              onClick={() => {
                const next = new Date(startDate);
                next.setDate(startDate.getDate() + 7);
                setStartDate(next);
              }}
            >
              Next
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date) => {
            const iso = date.toISOString().split("T")[0];
            const selected = draft.schedule.dateISO === iso;
            return (
              <button
                key={iso}
                type="button"
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${selected ? "border-[#163022] bg-[#163022] text-white" : "border-[#e3ded2] bg-white text-[#163022]"
                  }`}
                onClick={() => {
                  updateDraft({ schedule: { ...draft.schedule, dateISO: iso, label: formatDateLabel(date) } });
                }}
              >
                {formatDateLabel(date)}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {slots.length === 0 ? (
            <div className="rounded-2xl border border-[#e3ded2] bg-white px-4 py-4 text-sm text-[#5c5a55]">
              We're all booked on this day. Please select a different day in the future.
            </div>
          ) : (
            Object.entries(
              slots.reduce<Record<string, string[]>>((acc, slot) => {
                const parts = slot.split(" ");
                const time = parts[0] || "";
                const period = parts[1] || "";
                const hour = time.split(":")[0];
                const label = `${hour} ${period.toLowerCase()}`;
                acc[label] = acc[label] ? [...acc[label], slot] : [slot];
                return acc;
              }, {})
            ).map(([label, group]) => (
              <div key={label} className="space-y-2">
                <div className="text-sm font-semibold text-[#163022]">{label}</div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {group.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        updateDraft({
                          schedule: {
                            ...draft.schedule,
                            dateISO: draft.schedule.dateISO || selectedDate.toISOString().split("T")[0],
                            label: `${formatDateLabel(selectedDate)} - ${slot}`,
                            timeSlotStartISO: slot,
                          },
                        });
                        bookingAnalytics.selectionMade("timeslot", slot);
                      }}
                      className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${draft.schedule.timeSlotStartISO === slot
                        ? "border-[#163022] bg-[#f7f4ed]"
                        : "border-[#e3ded2] bg-white"
                        }`}
                      aria-pressed={draft.schedule.timeSlotStartISO === slot}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          className={`${buttonPrimary} w-full md:w-auto`}
          onClick={() => {
            // Skip contact details for logged-in users
            if (user) {
              navigate({ to: "/booking-quiz/address-details" });
            } else {
              navigate({ to: "/booking-quiz/details" });
            }
          }}
          disabled={!draft.schedule.label}
        >
          {user ? "Continue →" : "Add Contact Details →"}
        </button>
      </div>
    </WizardLayout>
  );
}

function SchedulePage() {
  return <ScheduleContent />;
}
