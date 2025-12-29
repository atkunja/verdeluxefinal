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
  // Dynamic color theme based on clean type
  const theme = {
    tidy: {
      border: "border-teal-200",
      activeBorder: "border-teal-500",
      bg: "bg-teal-50/50",
      activeBg: "bg-teal-50",
      text: "text-teal-900",
      accent: "text-teal-600",
      ring: "ring-teal-500/20",
      button: "bg-teal-600 hover:bg-teal-700"
    },
    basic: {
      border: "border-emerald-200",
      activeBorder: "border-emerald-500",
      bg: "bg-emerald-50/50",
      activeBg: "bg-emerald-50",
      text: "text-emerald-900",
      accent: "text-emerald-600",
      ring: "ring-emerald-500/20",
      button: "bg-emerald-600 hover:bg-emerald-700"
    },
    deep: {
      border: "border-violet-200",
      activeBorder: "border-violet-500",
      bg: "bg-violet-50/50",
      activeBg: "bg-violet-50",
      text: "text-violet-900",
      accent: "text-violet-600",
      ring: "ring-violet-500/20",
      button: "bg-violet-600 hover:bg-violet-700"
    },
    moving: {
      border: "border-amber-200",
      activeBorder: "border-amber-500",
      bg: "bg-amber-50/50",
      activeBg: "bg-amber-50",
      text: "text-amber-900",
      accent: "text-amber-600",
      ring: "ring-amber-500/20",
      button: "bg-amber-600 hover:bg-amber-700"
    },
  }[item.id as "tidy" | "basic" | "deep" | "moving"] || {
    // Fallback
    border: "border-slate-200", activeBorder: "border-emerald-500", bg: "bg-white", activeBg: "bg-emerald-50", text: "text-slate-900", accent: "text-emerald-600", ring: "ring-emerald-500/20", button: "bg-emerald-600"
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full rounded-3xl border-2 px-8 py-8 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${selected
          ? `${theme.activeBorder} ${theme.activeBg} shadow-lg ring-4 ${theme.ring}`
          : `${theme.border} bg-white hover:border-gray-300`
        }`}
      aria-pressed={selected}
    >
      <div className="flex items-center justify-between mb-6">
        <div className={`text-2xl font-black tracking-tight ${theme.text}`}>{item.title}</div>
        {"badge" in item && item.badge && (
          <span className="rounded-full bg-amber-400/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-900 border border-amber-400/30">
            {item.badge}
          </span>
        )}
      </div>

      <div className="text-base text-slate-600 mb-8 space-y-2">
        {item.description.map((line) => (
          <div key={line} className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${theme.activeBorder.replace('border', 'bg')}`} />
            {line}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200/60 pt-6">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Starting at</span>
          <span className={`text-2xl font-bold ${theme.accent}`}>${item.priceFrom}</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Est. Time</span>
          <span className="text-lg font-bold text-slate-700">{Math.round(item.durationMinutes / 60)} hrs</span>
        </div>
      </div>

      <div className={`mt-6 w-full rounded-xl py-3 text-center text-sm font-bold uppercase tracking-widest text-white transition-all transform ${selected ? `${theme.button} shadow-lg scale-100` : "bg-slate-200 text-slate-400 scale-95"
        }`}>
        {selected ? "Selected" : "Select Plan"}
      </div>
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
