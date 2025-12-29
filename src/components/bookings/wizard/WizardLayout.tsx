import { STEP_LABELS } from "./bookingDraft";

const cardBase = "rounded-3xl border border-white/50 bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(22,48,34,0.1)]";

export function Stepper({ step }: { step: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {STEP_LABELS.map((label, idx) => {
        const isCurrent = idx === step;
        const isDone = idx < step;

        return (
          <div key={label} className="flex items-center">
            <div
              className={`
                hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300
                ${isCurrent
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : isDone
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-transparent text-slate-400 opacity-60"
                }
              `}
            >
              <div className={`w-2 h-2 rounded-full ${isCurrent ? "bg-white animate-pulse" : isDone ? "bg-emerald-600" : "bg-slate-300"}`} />
              {label}
            </div>
            {/* Mobile simplified stepper */}
            <div className={`
                md:hidden h-1.5 rounded-full transition-all duration-300 mx-0.5
                ${isCurrent ? "w-8 bg-emerald-600" : isDone ? "w-4 bg-emerald-200" : "w-2 bg-slate-100"}
            `} />
          </div>
        );
      })}
    </div>
  );
}

import { useNavigate, Link } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { ArrowLeft, User } from "lucide-react";

// ...

export function WizardLayout({
  step,
  summary,
  children,
}: {
  step?: number;
  summary?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();

  const getPortalLink = () => {
    if (!user) return "/";
    if (user.role === "ADMIN" || user.role === "OWNER") return "/admin-portal";
    return user.role === "CLEANER" ? "/cleaner-portal" : "/client-portal";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/50 to-white px-4 py-8 text-slate-900 md:px-8">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-teal-50/60 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 md:flex-row">
        <div className="md:w-2/3 md:pr-4">

          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>

            {user && (
              <Link
                to={getPortalLink()}
                className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-800 transition-colors hover:bg-emerald-200"
              >
                <User className="w-3 h-3" />
                Return to Portal
              </Link>
            )}
          </div>

          {typeof step === "number" && (
            <Stepper step={step} />
          )}
          <div className={`${cardBase} relative flex flex-col gap-8 p-6 md:p-10 `}>{children}</div>
        </div>
        {summary && (
          <div className="md:w-1/3">
            <div className="sticky top-6">
              {summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
