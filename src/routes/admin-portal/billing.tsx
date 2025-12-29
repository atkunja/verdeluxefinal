import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "~/stores/authStore";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";
import { AdminShell } from "~/components/admin/AdminShell";
import { Clock, CreditCard, AlertTriangle, CheckCircle, Settings } from "lucide-react";

export const Route = createFileRoute("/admin-portal/billing")({
  component: BillingPage,
});

function BillingPage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token || !user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
      navigate({ to: "/login" });
    }
  }, [token, user, navigate]);

  const configQuery = useQuery(trpc.payments.getBillingConfig.queryOptions(undefined, { enabled: !!token }));
  const saveMutation = useMutation(
    trpc.payments.setBillingConfig.mutationOptions({
      onSuccess: () => {
        toast.success("Billing configuration saved");
        queryClient.invalidateQueries({ queryKey: trpc.payments.getBillingConfig.queryKey() });
      },
      onError: (err) => toast.error(err.message || "Failed to save"),
    })
  );

  const handleSave = (value: number | null) => {
    saveMutation.mutate({ holdDelayHours: value });
  };

  return (
    <AdminShell
      title="Billing Settings"
      subtitle="Configure payment timing and billing preferences"
    >
      {/* Stats/Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="premium-card !p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hold Delay</p>
              <p className="text-2xl font-black text-[#163022] mt-1">
                {configQuery.data?.holdDelayHours ?? "Immediate"}
                {configQuery.data?.holdDelayHours && <span className="text-sm font-medium text-slate-400 ml-1">hrs</span>}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#163022]/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-[#163022]" />
            </div>
          </div>
        </div>
        <div className="premium-card !p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Method</p>
              <p className="text-lg font-bold text-slate-900 mt-1">Stripe</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="premium-card !p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Status</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">Active</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="premium-card !p-5 bg-blue-50/50 border-blue-100 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Settings className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900">About Payment Hold Timing</h3>
            <p className="text-sm text-blue-700 mt-1">
              By default, payment holds are placed immediately when a booking is created. Configure a delay so holds are only placed within a specified number of hours before the scheduled time.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Card */}
      <div className="premium-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Clock className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Payment Hold Timing</h2>
            <p className="text-xs text-slate-500">Configure when payment holds are placed</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Hold Delay (Hours)
            </label>
            <input
              type="number"
              placeholder="e.g., 48"
              defaultValue={configQuery.data?.holdDelayHours ?? ""}
              className="w-full max-w-sm h-12 px-4 border border-slate-200 bg-slate-50 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#163022]/20 focus:border-[#163022] transition-all"
              onBlur={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                if (e.target.value && Number.isNaN(Number(e.target.value))) return;
                handleSave(val);
              }}
            />
            <p className="text-xs text-slate-500 mt-2">
              Leave empty to place payment holds immediately (default behavior).
            </p>
          </div>

          {/* Info Boxes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Current Behavior</span>
              </div>
              <p className="text-sm text-emerald-700">
                Payment holds will be placed automatically when a booking reaches the configured window.
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Important</span>
              </div>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Applies to new bookings with saved payment methods</li>
                <li>• Existing holds will not be affected</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button className="h-10 px-5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all">
              Reset to Default
            </button>
            <button
              onClick={() => handleSave(configQuery.data?.holdDelayHours ?? null)}
              disabled={saveMutation.isPending}
              className="h-10 px-5 rounded-xl bg-[#163022] text-white text-xs font-bold shadow-lg hover:bg-[#264e3c] transition-all disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
