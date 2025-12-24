import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "~/components/PortalLayout";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin/settings/discount")({
  component: DiscountSettingsPage,
});

function DiscountSettingsPage() {
  const trpc = useTRPC();
  const discountQuery = useQuery(trpc.booking.getDiscountConfig.queryOptions());
  const [form, setForm] = useState({
    active: false,
    type: "PERCENT",
    value: 0,
    label: "Get Discount",
  });

  const updateMutation = useMutation(
    trpc.booking.upsertDiscountConfig.mutationOptions({
      onSuccess: () => toast.success("Discount saved"),
      onError: (err) => toast.error(err.message || "Failed to save"),
    })
  );

  useEffect(() => {
    if (discountQuery.data) {
      setForm({
        active: discountQuery.data.active,
        type: discountQuery.data.type,
        value: discountQuery.data.value,
        label: discountQuery.data.label,
      });
    }
  }, [discountQuery.data]);

  return (
    <PortalLayout portalType="admin">
      <div className="min-h-screen bg-[#edeae1] px-6 py-10">
        <div className="max-w-2xl bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-semibold text-[#163022] mb-6">Discount Settings</h1>
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Discount active
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm text-gray-700">
                Type
                <select
                  className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="PERCENT">Percent</option>
                  <option value="FIXED_AMOUNT">Fixed amount</option>
                </select>
              </label>
              <label className="text-sm text-gray-700">
                Value
                <input
                  type="number"
                  min={0}
                  className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                />
              </label>
            </div>
            <label className="text-sm text-gray-700">
              CTA Label
              <input
                className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </label>
            <button
              type="button"
              onClick={() => updateMutation.mutate(form)}
              className="w-full rounded-xl bg-[#163022] text-white py-3 font-semibold"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Discount"}
            </button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
