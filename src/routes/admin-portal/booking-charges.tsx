import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "~/components/PortalLayout";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";
import { formatDetroitDate } from "~/utils/formatTime";
import { Search, Calendar, CreditCard, AlertCircle, CheckCircle, RefreshCw, DollarSign, Filter, XCircle, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/admin-portal/booking-charges")({
  component: BookingChargesPage,
});

function BookingChargesPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pending" | "holds" | "declined" | "all">("pending");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!token || !user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
      void navigate({ to: "/login" });
    }
  }, [token, user, navigate]);

  // Queries
  const pendingChargesQuery = useQuery(trpc.payments.getPendingCharges.queryOptions());
  const chargesQuery = useQuery(trpc.payments.listCharges.queryOptions(undefined, { enabled: activeTab === 'all' || activeTab === 'declined' }));
  const holdsQuery = useQuery(trpc.payments.listHolds.queryOptions(undefined, { enabled: activeTab === 'holds' }));

  // Mutations
  const chargeMutation = useMutation(trpc.stripe.createChargeWithSavedMethod.mutationOptions({
    onSuccess: () => {
      toast.success("Charge successful");
      void queryClient.invalidateQueries({ queryKey: trpc.payments.getPendingCharges.queryKey });
      void queryClient.invalidateQueries({ queryKey: trpc.payments.listCharges.queryKey() });
    },
    onError: (err) => toast.error(err.message || "Charge failed"),
  }));

  const retryPaymentMutation = useMutation(trpc.stripe.createChargeWithSavedMethod.mutationOptions({ // Re-using logic, or specific retry endpoint if exists
    onSuccess: () => {
      toast.success("Payment retried");
      void queryClient.invalidateQueries({ queryKey: trpc.payments.listCharges.queryKey() });
    },
    onError: (err) => toast.error("Retry failed: " + err.message)
  }));


  const refundMutation = useMutation(trpc.stripe.refundPayment.mutationOptions({
    onSuccess: () => {
      toast.success("Refund issued");
      void queryClient.invalidateQueries({ queryKey: trpc.payments.listCharges.queryKey() });
    },
    onError: (err) => toast.error(err.message || "Refund failed"),
  }));

  // Filtering Logic
  const filteredPending = useMemo(() => {
    let data = pendingChargesQuery.data || [];
    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(c =>
        c.customer.name.toLowerCase().includes(lower) ||
        c.id.toString().includes(lower) ||
        c.customer.email.toLowerCase().includes(lower)
      );
    }
    // Date filter logic would go here if we parsed dates from string
    return data;
  }, [pendingChargesQuery.data, search]);

  const filteredDeclinced = useMemo(() => {
    let data = (chargesQuery.data || []).filter(c => c.status === 'failed' || c.status === 'requires_payment_method');
    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(c => c.description?.toLowerCase().includes(lower) || c.id.toLowerCase().includes(lower));
    }
    return data;
  }, [chargesQuery.data, search]);

  const filteredAll = useMemo(() => {
    let data = chargesQuery.data || [];
    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(c => c.description?.toLowerCase().includes(lower) || c.id.toLowerCase().includes(lower));
    }
    return data;
  }, [chargesQuery.data, search]);


  const renderTabButton = (id: typeof activeTab, label: string, icon: any, count?: number) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all ${activeTab === id
          ? "text-[#163022] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#163022]"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        }`}
    >
      <div className={`p-1 rounded-md ${activeTab === id ? 'bg-[#163022]/10 text-[#163022]' : 'text-gray-400'}`}>
        {icon}
      </div>
      {label}
      {count !== undefined && (
        <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${activeTab === id ? 'bg-[#163022] text-white' : 'bg-gray-100 text-gray-600'}`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <PortalLayout portalType="admin">
      {/* Header Section */}
      <div className="bg-[#f7f4ed] pb-8 pt-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#163022]">Booking Charges</h1>
            <p className="text-sm text-gray-500 mt-1">Manage payments, holds, and refunds for all bookings</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Could translate user avatar/notif here if not in sidebar */}
          </div>
        </div>

        {/* Tabs Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {renderTabButton("pending", "Pending Charges", <DollarSign className="h-4 w-4" />, pendingChargesQuery.data?.length)}
            {renderTabButton("holds", "Card Hold(s)", <CreditCard className="h-4 w-4" />, holdsQuery.data?.length)}
            {renderTabButton("declined", "Declined Charges", <XCircle className="h-4 w-4" />, filteredDeclinced.length)}
            {renderTabButton("all", "All Charges", <CheckCircle className="h-4 w-4" />)}
          </div>

          {/* Filters */}
          <div className="p-4 bg-white flex flex-wrap gap-4 items-end border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 w-full">
              <Filter className="h-4 w-4" /> Filters
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#163022] focus:outline-none w-40"
                />
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#163022] focus:outline-none w-40"
                />
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name, email, phone, ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#163022] focus:outline-none"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="min-h-[400px]">
            {activeTab === "pending" && (
              <div className="overflow-x-auto">
                <div className="px-6 py-4 flex justify-between items-center bg-gray-50/50 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-[#163022]">Pending Charges ({filteredPending.length})</h3>
                  <span className="text-xs font-bold text-emerald-600">
                    Total: ${filteredPending.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}
                  </span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-6 py-4">Service Date & Time</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Booking ID</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredPending.map(charge => (
                      <tr key={charge.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{charge.serviceDate}</div>
                          <div className="text-xs text-gray-500">{charge.serviceTime}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{charge.customer.name}</div>
                          <div className="text-xs text-gray-500">{charge.customer.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">#{charge.id}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {charge.address}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600">
                          ${charge.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              if (window.confirm(`Charge $${charge.amount} to ${charge.customer.name}?`)) {
                                chargeMutation.mutate({ userId: charge.customer.id, bookingId: charge.id, amount: charge.amount });
                              }
                            }}
                            disabled={chargeMutation.isPending}
                            className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                          >
                            <DollarSign className="h-3 w-3" /> Charge
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredPending.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No pending charges found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Other tabs can be implemented similarly or placeholder for now */}
            {activeTab === "holds" && (
              <div className="p-12 text-center text-gray-400 italic">
                Holds management view coming soon.
              </div>
            )}

            {activeTab === "declined" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-6 py-4">Date Attempted</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredDeclinced.map(charge => (
                      <tr key={charge.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-gray-600">{charge.created ? formatDetroitDate(charge.created) : '-'}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{charge.description || 'Unknown'}</td>
                        <td className="px-6 py-4 font-bold text-red-600">${Number(charge.amount).toFixed(2)}</td>
                        <td className="px-6 py-4"><span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs font-bold uppercase">Declined</span></td>
                        <td className="px-6 py-4">
                          <button className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1">
                            <RotateCcw className="h-3 w-3" /> Retry
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "all" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredAll.map(charge => (
                      <tr key={charge.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-gray-600">{charge.created ? formatDetroitDate(charge.created) : '-'}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{charge.description || '-'}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">${Number(charge.amount).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${charge.status === 'succeeded' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {charge.status === 'succeeded' ? 'Paid' : charge.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">{charge.paymentMethod || 'Card'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
