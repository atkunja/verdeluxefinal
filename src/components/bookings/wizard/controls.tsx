import { CLEAN_TYPES, EXTRAS } from "./bookingDraft";

const cardBase = "rounded-2xl border border-[#e3ded2] bg-white shadow-[0_12px_26px_rgba(22,48,34,0.08)]";
const buttonSecondary =
  "rounded-xl border border-[#163022] text-[#163022] px-4 py-2 font-semibold transition hover:bg-[#163022] hover:text-white";

export function CleanTypeCard({
  item,
  selected,
  onSelect,
}: {
  item: (typeof CLEAN_TYPES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${cardBase} flex w-full flex-col gap-3 border-2 px-4 py-4 text-left transition hover:-translate-y-1 ${
        selected ? "border-[#163022] shadow-lg" : "border-transparent"
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-[#163022]">{item.title}</div>
        {item.badge && (
          <span className="rounded-full bg-[#f0eadd] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#163022]">
            {item.badge}
          </span>
        )}
      </div>
      <div className="text-sm text-[#5c5a55]">
        {item.description.map((line) => (
          <div key={line}>• {line}</div>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm font-semibold text-[#163022]">
        <span>From ${item.priceFrom}</span>
        <span>{Math.round(item.durationMinutes / 60)} hr</span>
      </div>
      <span className={`${buttonSecondary} mt-1 inline-flex w-fit px-4 py-2 text-sm ${
        selected ? "bg-[#163022] text-white" : ""
      }`}>
        {selected ? "Selected" : "Select"}
      </span>
    </button>
  );
}

export function Counter({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#e3ded2] bg-white px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-[#163022]">{label}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className={`${buttonSecondary} h-9 px-3 text-sm`}
          aria-label={`Decrease ${label}`}
        >
          -
        </button>
        <span className="w-6 text-center text-sm font-semibold text-[#163022]">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className={`${buttonSecondary} h-9 px-3 text-sm`}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function YesNoToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#e3ded2] bg-white px-4 py-3">
      <span className="text-sm font-semibold text-[#163022]">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`${buttonSecondary} h-9 px-4 text-sm ${!value ? "bg-[#163022] text-white" : ""}`}
          aria-pressed={!value}
        >
          No
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`${buttonSecondary} h-9 px-4 text-sm ${value ? "bg-[#163022] text-white" : ""}`}
          aria-pressed={value}
        >
          Yes
        </button>
      </div>
    </div>
  );
}

export function ExtrasSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXTRAS.map((extra) => {
        const active = selected.includes(extra.id);
        return (
          <button
            key={extra.id}
            type="button"
            onClick={() =>
              onChange(active ? selected.filter((id) => id !== extra.id) : [...selected, extra.id])
            }
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              active
                ? "border-[#163022] bg-[#f7f4ed] text-[#163022]"
                : "border-[#e3ded2] bg-white text-[#5c5a55]"
            }`}
            aria-pressed={active}
          >
            <span className="mr-2">+</span>
            {extra.label}
          </button>
        );
      })}
    </div>
  );
}

export function TimeSlotGrid({
  slots,
  value,
  onChange,
}: {
  slots: string[];
  value?: string;
  onChange: (slot: string) => void;
}) {
  if (!slots.length) {
    return (
      <div className={`${cardBase} border px-4 py-4 text-sm text-[#5c5a55]`}>
        We’re all booked on this day. Please select a different day in the future.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onChange(slot)}
          className={`${cardBase} border px-3 py-3 text-sm font-semibold transition hover:-translate-y-[1px] ${
            value === slot ? "border-[#163022] bg-[#f7f4ed]" : "border-transparent"
          }`}
          aria-pressed={value === slot}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
