import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";
import { formatDetroitDate } from "~/utils/formatTime";
import { Search, Calendar, CreditCard, AlertCircle, CheckCircle, RefreshCw, DollarSign, Filter, XCircle, RotateCcw, Clock, TrendingUp, Users } from "lucide-react";
import { AdminShell } from "~/components/admin/AdminShell";

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

  const retryPaymentMutation = useMutation(trpc.stripe.createChargeWithSavedMethod.mutationOptions({
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

  const totalPending = filteredPending.reduce((sum, c) => sum + c.amount, 0);

  const tabs = [
    { id: "pending" as const, label: "Pending", icon: Clock, count: pendingChargesQuery.data?.length },
    { id: "holds" as const, label: "Holds", icon: CreditCard, count: holdsQuery.data?.length },
    { id: "declined" as const, label: "Declined", icon: XCircle, count: filteredDeclinced.length },
    { id: "all" as const, label: "All Charges", icon: CheckCircle },
  ];

  return (
    <AdminShell
      title="Booking Charges"
      subtitle="Process payments, manage holds, and track refunds"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="premium-card !p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{filteredPending.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
        <div className="premium-card !p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Value</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">${totalPending.toFixed(2)}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>
        <div className="premium-card !p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Declined</p>
              <p className="text-2xl font-black text-rose-600 mt-1">{filteredDeclinced.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-rose-500" />
            </div>
          </div>
        </div>
        <div className="premium-card !p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Holds</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{holdsQuery.data?.length || 0}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="premium-card !p-0 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                  ? "text-[#163022] bg-white border-b-2 border-[#163022]"
                  : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === tab.id ? "bg-[#163022] text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-5 bg-white border-b border-slate-100">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="h-10 pl-10 pr-4 border border-slate-200 rounded-xl text-sm focus:border-[#163022] focus:outline-none w-40"
                />
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="h-10 pl-10 pr-4 border border-slate-200 rounded-xl text-sm focus:border-[#163022] focus:outline-none w-40"
                />
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name, email, booking ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 border border-slate-200 rounded-xl text-sm focus:border-[#163022] focus:outline-none"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {activeTab === "pending" && (
            <div>
              <div className="px-6 py-4 flex justify-between items-center bg-slate-50/50 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                  Pending Charges
                </h3>
                <span className="text-sm font-bold text-emerald-600">
                  Total: ${totalPending.toFixed(2)}
                </span>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPending.map(charge => (
                    <tr key={charge.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-900">{charge.serviceDate}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{charge.serviceTime}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                            {charge.customer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{charge.customer.name}</div>
                            <div className="text-xs text-slate-500">{charge.customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold">
                          #{charge.id}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600 max-w-[200px] truncate">
                        {charge.address}
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-lg font-black text-[#163022]">${charge.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`Charge $${charge.amount} to ${charge.customer.name}?`)) {
                              chargeMutation.mutate({ userId: charge.customer.id, bookingId: charge.id, amount: charge.amount });
                            }
                          }}
                          disabled={chargeMutation.isPending}
                          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#163022] text-white text-xs font-bold hover:bg-[#264e3c] transition-all shadow-lg disabled:opacity-50"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPending.length === 0 && (
                <div className="py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">All caught up!</p>
                  <p className="text-slate-400 mt-1">No pending charges to process</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "holds" && (
            <div className="py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-blue-300" />
              </div>
              <p className="text-lg font-bold text-slate-900">Card Holds</p>
              <p className="text-slate-400 mt-1">Hold management coming soon</p>
            </div>
          )}

          {activeTab === "declined" && (
            <div>
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredDeclinced.map(charge => (
                    <tr key={charge.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {charge.created ? formatDetroitDate(charge.created) : '-'}
                      </td>
                      <td className="px-6 py-5 font-medium text-slate-900">{charge.description || 'Unknown'}</td>
                      <td className="px-6 py-5 font-bold text-rose-600">${Number(charge.amount).toFixed(2)}</td>
                      <td className="px-6 py-5">
                        <span className="inline-flex px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-bold uppercase">
                          Declined
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-all">
                          <RotateCcw className="h-3 w-3" />
                          Retry
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredDeclinced.length === 0 && (
                <div className="py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-300" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">No declined charges</p>
                  <p className="text-slate-400 mt-1">All payments have been successful</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "all" && (
            <div>
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAll.map(charge => (
                    <tr key={charge.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {charge.created ? formatDetroitDate(charge.created) : '-'}
                      </td>
                      <td className="px-6 py-5 font-medium text-slate-900">{charge.description || '-'}</td>
                      <td className="px-6 py-5 font-bold text-slate-900">${Number(charge.amount).toFixed(2)}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${charge.status === 'succeeded'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                          }`}>
                          {charge.status === 'succeeded' ? 'Paid' : charge.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs text-slate-500">{charge.paymentMethod || 'Card'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAll.length === 0 && (
                <div className="py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">No charges yet</p>
                  <p className="text-slate-400 mt-1">Charges will appear here once processed</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
