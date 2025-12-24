import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "~/components/PortalLayout";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";
import { formatDetroitDate } from "~/utils/formatTime";
import { buildPaymentTimeline } from "~/utils/paymentTimeline";

export const Route = createFileRoute("/admin-portal/booking-charges")({
  component: BookingChargesPage,
});

function BookingChargesPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newHoldBookingId, setNewHoldBookingId] = useState<number | "">("");
  const [newHoldAmount, setNewHoldAmount] = useState<number | "">("");

  useEffect(() => {
    if (!token || !user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
      void navigate({ to: "/login" });
    }
  }, [token, user, navigate]);

  type PaymentRow = {
    id: string;
    amount: number;
    currency: string;
    status: string;
    description?: string;
    bookingId?: number | string;
    created?: Date | string | null;
    paymentMethod?: string;
    paymentIntentId?: string;
  };

  const chargesQuery = useQuery(
    trpc.payments.listCharges.queryOptions(undefined, { enabled: !!token })
  );
  const holdsQuery = useQuery(
    trpc.payments.listHolds.queryOptions(undefined, { enabled: !!token })
  );
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const refundMutation = useMutation(
    trpc.stripe.refundPayment.mutationOptions({
      onSuccess: () => {
        toast.success("Refund issued");
        void queryClient.invalidateQueries({ queryKey: trpc.payments.listCharges.queryKey() });
      },
      onError: (err) => toast.error(err.message || "Refund failed"),
    })
  );

  const captureHoldMutation = useMutation(
    trpc.payments.captureHold.mutationOptions({
      onSuccess: () => {
        toast.success("Hold captured");
        void queryClient.invalidateQueries({ queryKey: trpc.payments.listHolds.queryKey() });
        void queryClient.invalidateQueries({ queryKey: trpc.payments.listCharges.queryKey() });
      },
      onError: (err) => toast.error(err.message || "Failed to capture"),
    })
  );

  const cancelHoldMutation = useMutation(
    trpc.payments.cancelHold.mutationOptions({
      onSuccess: () => {
        toast.success("Hold canceled");
        void queryClient.invalidateQueries({ queryKey: trpc.payments.listHolds.queryKey() });
      },
      onError: (err) => toast.error(err.message || "Failed to cancel"),
    })
  );

  const createHoldMutation = useMutation(
    trpc.payments.createHold.mutationOptions({
      onSuccess: () => {
        toast.success("Hold created");
        setNewHoldAmount("");
        setNewHoldBookingId("");
        void queryClient.invalidateQueries({ queryKey: trpc.payments.listHolds.queryKey() });
      },
      onError: (err) => toast.error(err.message || "Failed to create hold"),
    })
  );

  const updateHoldMutation = useMutation(
    trpc.payments.updateHold.mutationOptions({
      onSuccess: () => {
        toast.success("Hold adjusted");
        void queryClient.invalidateQueries({ queryKey: trpc.payments.listHolds.queryKey() });
      },
      onError: (err) => toast.error(err.message || "Failed to adjust hold"),
    })
  );

  const charges = (chargesQuery.data ?? []) as PaymentRow[];
  const holds = (holdsQuery.data ?? []) as PaymentRow[];
  const paymentTimeline = buildPaymentTimeline({
    charges,
    holds,
  });

  return (
    <PortalLayout portalType="admin">
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-emerald-900 text-white">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold">Booking Charges</h1>
            <p className="text-sm text-white/80">Manage payments, holds, and refunds for all bookings.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-wrap gap-2 border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
              <span className="px-3 py-2 border-b-2 border-primary text-primary">Pending Charges</span>
              <span className="px-3 py-2 text-gray-600">Card Hold(s)</span>
              <span className="px-3 py-2 text-gray-600">Declined Charges</span>
              <span className="px-3 py-2 text-gray-600">All Charges</span>
            </div>

            <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap gap-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
                />
                <input
                  type="date"
                  className="border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
                />
              </div>
              <input
                type="text"
                placeholder="Search"
                className="border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] rounded-lg px-3 py-2 flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
              />
            </div>

            <div className="divide-y divide-gray-100">
              <div className="grid grid-cols-7 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span>Description</span>
                <span>Booking</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Method</span>
                <span>Currency</span>
                <span className="text-right">Actions</span>
              </div>
              {chargesQuery.isLoading ? (
                <div className="px-4 py-6 text-sm text-gray-600">Loading charges...</div>
              ) : chargesQuery.isError ? (
                <div className="px-4 py-6 text-sm text-red-600">Failed to load charges.</div>
              ) : (chargesQuery.data || []).length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-600">No charges.</div>
              ) : (
                charges.map((c) => (
                  <div key={c.id} className="grid grid-cols-7 items-center px-4 py-3 text-sm hover:bg-gray-50">
                    <div className="text-gray-800">
                      <div className="font-semibold">{c.description || "Charge"}</div>
                      <div className="text-xs text-gray-500">
                        {c.bookingId ? `Booking #${c.bookingId}` : "Manual"} • {c.id.slice(-6)}
                      </div>
                      {c.created && (
                        <div className="text-xs text-gray-500">Created {formatDetroitDate(c.created)}</div>
                      )}
                    </div>
                    <div className="text-gray-700">{c.bookingId ? `#${c.bookingId}` : "-"}</div>
                    <div className="text-green-700 font-semibold">${Number(c.amount).toFixed(2)}</div>
                    <div className="text-xs text-gray-700 uppercase">
                      {c.status === "succeeded" ? "PAID" : c.status?.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-700">{c.paymentMethod || "—"}</div>
                    <div className="text-xs text-gray-600">{c.currency?.toUpperCase()}</div>
                    <div className="flex items-center gap-2 justify-end">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Amount"
                        className="w-24 px-2 py-1 border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                      />
                      <button
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs"
                        onClick={() =>
                          refundMutation.mutate({
                            paymentIntentId: c.paymentIntentId || c.id,
                            amount: refundAmount ? Number(refundAmount) : undefined,
                          })
                        }
                        disabled={refundMutation.isPending}
                      >
                        Refund
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-wrap gap-2 border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
              <span className="px-3 py-2 border-b-2 border-primary text-primary">Card Hold(s)</span>
            </div>
            <div className="px-4 py-3 border-b border-gray-200 grid gap-3 md:grid-cols-3 text-sm text-gray-700">
              <input
                type="number"
                placeholder="Booking ID (optional)"
                value={newHoldBookingId}
                onChange={(e) => setNewHoldBookingId(e.target.value === "" ? "" : Number(e.target.value))}
                className="border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
              />
              <input
                type="number"
                placeholder="Hold amount"
                value={newHoldAmount}
                onChange={(e) => setNewHoldAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
              />
              <button
                onClick={() => {
                  if (!newHoldAmount || Number(newHoldAmount) <= 0) {
                    toast.error("Enter a valid amount");
                    return;
                  }
                  createHoldMutation.mutate({
                    amount: Number(newHoldAmount),
                    bookingId: newHoldBookingId === "" ? undefined : Number(newHoldBookingId),
                  });
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
                disabled={createHoldMutation.isPending}
              >
                Create Hold
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="grid grid-cols-6 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span>Description</span>
                <span>Booking</span>
                <span>Hold Amount</span>
                <span>Status</span>
                <span>Currency</span>
                <span className="text-right">Actions</span>
              </div>
              {holdsQuery.isLoading ? (
                <div className="px-4 py-6 text-sm text-gray-600">Loading holds...</div>
              ) : holdsQuery.isError ? (
                <div className="px-4 py-6 text-sm text-red-600">Failed to load holds.</div>
              ) : (holdsQuery.data || []).length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-600">No holds.</div>
              ) : (
                holds.map((h) => {
                  const friendlyStatus =
                    h.status === "requires_capture" ? "Held - awaiting capture" : h.status;
                  return (
                    <div key={h.id} className="grid grid-cols-6 items-center px-4 py-3 text-sm hover:bg-gray-50">
                    <div className="text-gray-800">
                      <div className="font-semibold">{h.description || "Card hold"}</div>
                      <div className="text-xs text-gray-500">Intent: {h.id}</div>
                      {h.created && (
                        <div className="text-xs text-gray-500">Created {formatDetroitDate(h.created)}</div>
                      )}
                    </div>
                      <div className="text-gray-700">{h.bookingId ? `#${h.bookingId}` : "-"}</div>
                      <div className="text-green-700 font-semibold">${Number(h.amount).toFixed(2)}</div>
                      <div className="text-xs text-gray-700 uppercase">{friendlyStatus}</div>
                      <div className="text-xs text-gray-600">{h.currency?.toUpperCase()}</div>
                      <div className="flex items-center gap-2 justify-end">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="New amt"
                          className="w-20 px-2 py-1 border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                        />
                        <button
                          onClick={() =>
                            updateHoldMutation.mutate({
                              paymentIntentId: h.id,
                              amount: adjustAmount ? Number(adjustAmount) : Number(h.amount),
                              description: h.description,
                            })
                          }
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs disabled:opacity-60"
                          disabled={!adjustAmount}
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => captureHoldMutation.mutate({ paymentIntentId: h.id })}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs"
                        >
                          Capture
                        </button>
                        <button
                          onClick={() => cancelHoldMutation.mutate({ paymentIntentId: h.id })}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Payment Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
              Payment Timeline
            </div>
            {paymentTimeline.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-600">No payments or holds yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                <div className="grid grid-cols-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <span>Type</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Date</span>
                </div>
                {paymentTimeline.map((entry, idx) => (
                  <div key={idx} className="grid grid-cols-4 px-4 py-3 text-sm hover:bg-gray-50">
                    <span className="font-semibold text-gray-900">
                      {entry.label || entry.kind.toUpperCase()}
                    </span>
                    <span className="text-gray-800">
                      {entry.amount !== undefined ? `$${Number(entry.amount).toFixed(2)}` : "—"}
                    </span>
                    <span className="text-xs uppercase text-gray-700">{entry.status || "N/A"}</span>
                    <span className="text-xs text-gray-600">
                      {entry.createdAt ? formatDetroitDate(entry.createdAt) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
