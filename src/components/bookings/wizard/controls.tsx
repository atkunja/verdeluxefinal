import { CLEAN_TYPES, EXTRAS } from "./bookingDraft";

const cardBase = "rounded-2xl border border-slate-200 bg-white/50 shadow-sm transition-all duration-300";
const buttonSecondary =
  "rounded-xl border-2 border-slate-200 text-slate-600 px-4 py-2 font-bold transition hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700";

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
      className={`rounded-2xl border-2 px-6 py-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selected
        ? "border-emerald-600 bg-white shadow-emerald-900/10 ring-4 ring-emerald-500/10"
        : "border-slate-100 bg-white/50 hover:border-emerald-200"
        }`}
      aria-pressed={selected}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-bold text-slate-900">{item.title}</div>
        {"badge" in item && item.badge && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800 border border-amber-200">
            {item.badge}
          </span>
        )}
      </div>
      <div className="text-sm text-slate-500 mb-4 space-y-1">
        {item.description.map((line) => (
          <div key={line} className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">•</span>
            {line}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm font-semibold text-slate-900 border-t border-slate-100 pt-4">
        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg">From ${item.priceFrom}</span>
        <span className="text-slate-400">{Math.round(item.durationMinutes / 60)} hr</span>
      </div>
      <span className={`mt-4 w-full block text-center rounded-xl py-2 text-sm font-bold transition-colors ${selected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700"
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
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/50 px-5 py-4 transition-all hover:border-emerald-200">
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className={`${buttonSecondary} h-10 w-10 flex items-center justify-center !px-0 rounded-full`}
          aria-label={`Decrease ${label}`}
        >
          -
        </button>
        <span className="w-8 text-center text-lg font-bold text-slate-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className={`${buttonSecondary} h-10 w-10 flex items-center justify-center !px-0 rounded-full`}
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
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/50 px-5 py-4 transition-all hover:border-emerald-200">
      <span className="text-sm font-bold text-slate-900">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`h-10 px-5 rounded-xl text-sm font-bold transition-all ${!value ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-transparent text-slate-500 hover:bg-slate-100"}`}
          aria-pressed={!value}
        >
          No
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`h-10 px-5 rounded-xl text-sm font-bold transition-all ${value ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-transparent text-slate-500 hover:bg-slate-100"}`}
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
    <div className="flex flex-wrap gap-3">
      {EXTRAS.map((extra) => {
        const active = selected.includes(extra.id);
        return (
          <button
            key={extra.id}
            type="button"
            onClick={() =>
              onChange(active ? selected.filter((id) => id !== extra.id) : [...selected, extra.id])
            }
            className={`rounded-xl border-2 px-5 py-3 text-sm font-bold transition-all ${active
              ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm"
              : "border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-emerald-600"
              }`}
            aria-pressed={active}
          >
            <span className={`mr-2 inline-block transition-transform ${active ? "rotate-45" : ""}`}>+</span>
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
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6 text-sm text-slate-500 text-center">
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
          className={`rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 ${value === slot
            ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
            }`}
          aria-pressed={value === slot}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
