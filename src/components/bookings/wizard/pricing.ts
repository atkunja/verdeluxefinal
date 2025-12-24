import { BookingDraft, CLEAN_TYPES, EXTRAS } from "./bookingDraft";

export function calculatePricing(draft: BookingDraft) {
  const clean = CLEAN_TYPES.find((c) => c.id === draft.cleanType);
  const base = (clean?.priceFrom || 0) + Math.max(0, draft.beds - 1) * 15 + Math.max(0, draft.baths - 1) * 20;
  const extras = EXTRAS.filter((extra) => draft.extras.includes(extra.id));
  const extrasTotal = extras.reduce((sum, extra) => sum + extra.price, 0);
  const durationMinutes =
    (clean?.durationMinutes || 0) + extras.reduce((sum, extra) => sum + extra.durationMinutes, 0);

  return {
    base,
    extras: extrasTotal,
    total: base + extrasTotal,
    durationMinutes,
  };
}
