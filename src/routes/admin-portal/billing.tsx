import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { PortalLayout } from "~/components/PortalLayout";
import { useAuthStore } from "~/stores/authStore";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";

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
    <PortalLayout portalType="admin">
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-emerald-900 text-white">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold">Billing Configuration</h1>
            <p className="text-sm text-white/80 mt-1">Configure payment hold timing and billing settings.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
            <p className="font-semibold">About Payment Hold Timing</p>
            <p className="mt-1">
              By default, payment holds are placed immediately when a booking is created. Configure a delay so holds are only placed
              within a specified number of hours before the scheduled time.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Payment Hold Timing</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Hold Delay (hours)</label>
              <input
                type="number"
                placeholder="e.g., 48"
                defaultValue={configQuery.data?.holdDelayHours ?? ""}
                className="w-full max-w-sm border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
                onBlur={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  if (e.target.value && Number.isNaN(Number(e.target.value))) return;
                  handleSave(val);
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to place payment holds immediately (default behavior).
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              <p className="font-semibold">Current Behavior</p>
              <p className="mt-1">Payment holds will be placed automatically when a booking reaches the configured window.</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <p className="font-semibold">Important Notes</p>
              <ul className="list-disc list-inside">
                <li>This setting applies to new and updated bookings with saved payment methods.</li>
                <li>Existing bookings with holds already placed will not be affected.</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-lg border border-[#d7d1c4] text-[#163022] bg-[#f7f4ed] hover:bg-[#edeae1] transition">Reset</button>
              <button className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition">Save Configuration</button>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
