import { STEP_LABELS } from "./bookingDraft";

const cardBase = "rounded-2xl border border-[#e3ded2] bg-white shadow-[0_14px_30px_rgba(22,48,34,0.08)]";

export function Stepper({ step }: { step: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e3ded2] bg-white/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#163022] shadow-sm">
      {STEP_LABELS.map((label, idx) => {
        const state = idx === step ? "current" : idx < step ? "done" : "upcoming";
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] ${
                state === "current"
                  ? "border-[#163022] bg-[#163022] text-white"
                  : state === "done"
                  ? "border-[#163022] bg-white text-[#163022]"
                  : "border-[#d7d1c4] bg-white text-[#7a766c]"
              }`}
            >
              {idx + 1}
            </span>
            <span className={state === "upcoming" ? "text-[#7a766c]" : "text-[#163022]"}>{label}</span>
            {idx !== STEP_LABELS.length - 1 && <span className="text-[#d7d1c4]">/</span>}
          </div>
        );
      })}
    </div>
  );
}

export function WizardLayout({
  step,
  summary,
  children,
}: {
  step?: number;
  summary?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f1e8] px-4 py-8 text-[#163022] md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row">
        <div className="md:w-2/3 md:pr-4">
          {typeof step === "number" && (
            <div className="mb-4">
              <Stepper step={step} />
            </div>
          )}
          <div className={`${cardBase} relative flex flex-col gap-6 border p-5 md:p-7`}>{children}</div>
        </div>
        {summary && (
          <div className="md:w-1/3">
            {summary}
          </div>
        )}
      </div>
    </div>
  );
}
