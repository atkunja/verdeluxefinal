import React from "react";
import { CLEAN_TYPES, CLEANLINESS_LABELS, EXTRAS, BookingDraft } from "./bookingDraft";
import { useBookingDraft } from "./BookingWizardProvider";
import { useNavigate } from "@tanstack/react-router";

const cardBase = "rounded-2xl border border-[#e3ded2] bg-white shadow-[0_14px_30px_rgba(22,48,34,0.08)]";

function formatDuration(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs && mins) return `${hrs} hr ${mins} min`;
  if (hrs) return `${hrs} hr`;
  return `${mins} min`;
}

export function SummaryPanel({ draft }: { draft: BookingDraft }) {
  const [open, setOpen] = React.useState(false);
  const { resetDraft } = useBookingDraft();
  const navigate = useNavigate();
  const clean = CLEAN_TYPES.find((c) => c.id === draft.cleanType);
  const extras = EXTRAS.filter((extra) => draft.extras.includes(extra.id));
  const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
  const total = draft.pricing.total || (clean?.priceFrom || 0) + extrasTotal;

  const durationMinutes =
    draft.pricing.durationMinutes ||
    (clean?.durationMinutes || 0) + extras.reduce((sum, extra) => sum + extra.durationMinutes, 0);

  return (
    <div className={`${cardBase} sticky top-6 space-y-4 p-4 md:p-6`}>
      <div className="flex items-center justify-between text-sm font-semibold text-[#163022]">
        <span>Summary</span>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-full border border-[#e3ded2] px-3 py-1 text-xs font-semibold text-[#163022] md:hidden"
        >
          {open ? "Hide" : "Show"}
        </button>
        <span className="hidden text-xs text-[#7a766c] md:inline">Live updates</span>
      </div>
      <div className={`${open ? "block" : "hidden"} space-y-2 text-sm text-[#2b312c] md:block`}>
        <div className="flex items-center justify-between">
          <span>{clean?.title || "Clean"}</span>
          <span className="text-[#163022]">{formatDuration(durationMinutes)}</span>
        </div>
        {draft.beds > 0 && draft.baths > 0 && (
          <div className="flex items-center justify-between">
            <span>Beds / Baths</span>
            <span>{draft.beds} / {draft.baths}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span>Pets / Kids</span>
          <span>{draft.pets ? "Pets" : "No pets"} · {draft.kids ? "Kids" : "No kids"}</span>
        </div>
        {draft.cleanliness > 0 && (
          <div className="flex items-center justify-between">
            <span>Cleanliness</span>
            <span>{CLEANLINESS_LABELS[draft.cleanliness]}</span>
          </div>
        )}
        {draft.schedule.dateISO && draft.schedule.label && (
          <div className="flex items-center justify-between">
            <span>When</span>
            <span>{draft.schedule.label}</span>
          </div>
        )}
        {draft.contact.fullName && (
          <div className="flex items-center justify-between">
            <span>Contact</span>
            <span className="truncate text-right">{draft.contact.fullName}</span>
          </div>
        )}
        {draft.address.formatted && (
          <div className="flex flex-col gap-1">
            <span className="text-[#7a766c]">Address</span>
            <span className="text-[#163022]">{draft.address.formatted}</span>
          </div>
        )}
        <div className="pt-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Base</span>
            <span>${draft.pricing.base.toFixed(0)}</span>
          </div>
          {extras.map((extra) => (
            <div key={extra.id} className="flex items-center justify-between text-[#163022]">
              <span>+ {extra.label}</span>
              <span>${extra.price}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-dashed border-[#e3ded2] pt-2 font-semibold text-[#163022]">
            <span>Total</span>
            <span>${total.toFixed(0)}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-[#e3ded2]">
            <button
              type="button"
              onClick={() => {
                resetDraft();
                navigate({ to: "/booking-quiz/start", search: { intent: "choose" } });
              }}
              className="w-full text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
