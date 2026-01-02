import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "~/components/admin/AdminShell";
import { useTRPC } from "~/trpc/react";
import { Loader2, DollarSign, Calendar, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin-portal/payroll")({
    component: PayrollPage,
});

function PayrollPage() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [expandedCleaner, setExpandedCleaner] = useState<number | null>(null);
    const [payModalOpen, setPayModalOpen] = useState<{ cleanerId: number; name: string; balance: number } | null>(null);

    // Calculate start/end date for the selected month
    const startDate = `${selectedMonth}-01`;
    const endDate = new Date(new Date(selectedMonth).getFullYear(), new Date(selectedMonth).getMonth() + 1, 0).toISOString().slice(0, 10);

    const { data, isLoading } = useQuery(trpc.getPayoutSummary.queryOptions({ startDate, endDate }));
    const recordPaymentMutation = useMutation(trpc.recordCleanerPayment.mutationOptions());

    const handlePay = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!payModalOpen) return;

        const fd = new FormData(e.currentTarget);
        const amount = Number(fd.get("amount"));
        const description = fd.get("description") as string;

        if (!amount || amount <= 0) {
            toast.error("Invalid amount");
            return;
        }

        try {
            await recordPaymentMutation.mutateAsync({
                cleanerId: payModalOpen.cleanerId,
                amount,
                description,
                bookingId: undefined, // General payment
            });
            toast.success("Payment recorded");
            setPayModalOpen(null);
            queryClient.invalidateQueries({ queryKey: trpc.getPayoutSummary.queryOptions().queryKey });
        } catch (err: any) {
            toast.error(err.message || "Failed to record payment");
        }
    };

    return (
        <AdminShell title="Cleaner Payments" subtitle="Manage payroll and cleaner payouts.">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                    <Calendar className="w-5 h-5 text-gray-500 ml-2" />
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border-none bg-transparent text-sm font-bold text-gray-700 focus:ring-0"
                    />
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 font-bold uppercase">Period Total Owed</p>
                    <p className="text-2xl font-extrabold text-[#163022]">
                        ${(data?.summaries || []).reduce((acc, s) => acc + s.balance, 0).toFixed(2)}
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {(data?.summaries || []).map((summary) => (
                        <div key={summary.cleanerId} className="bg-white border boundary-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all">
                            <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="h-12 w-12 rounded-full bg-emerald-100/50 text-emerald-700 flex items-center justify-center text-lg font-bold border border-emerald-100">
                                        {summary.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{summary.name}</h3>
                                        <p className="text-sm text-gray-500">{summary.email}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 md:gap-8 items-center justify-center md:justify-end flex-1">
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hours</p>
                                        <p className="text-lg font-bold text-gray-700">{summary.totalHours.toFixed(1)}h</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Owed</p>
                                        <p className="text-lg font-bold text-gray-900">${summary.totalOwed.toFixed(2)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Paid</p>
                                        <p className="text-lg font-bold text-emerald-600">${summary.totalPaid.toFixed(2)}</p>
                                    </div>
                                    <div className="text-center bg-gray-50 px-4 py-2 rounded-xl min-w-[100px]">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Balance</p>
                                        <p className={`text-xl font-extrabold ${summary.balance > 0 ? "text-amber-600" : "text-gray-400"}`}>
                                            ${summary.balance.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPayModalOpen({ cleanerId: summary.cleanerId, name: summary.name, balance: summary.balance })}
                                        disabled={summary.balance <= 0}
                                        className="px-4 py-2 bg-[#163022] text-white rounded-xl font-bold text-sm hover:bg-[#0f241a] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-900/10 transition-all flex items-center gap-2"
                                    >
                                        <DollarSign className="w-4 h-4" /> Pay
                                    </button>
                                    <button
                                        onClick={() => setExpandedCleaner(expandedCleaner === summary.cleanerId ? null : summary.cleanerId)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        {expandedCleaner === summary.cleanerId ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {expandedCleaner === summary.cleanerId && (
                                <div className="bg-gray-50 border-t border-gray-100 p-6 animate-in slide-in-from-top-2">
                                    <div className="flex gap-2 mb-4">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Activity & Payments ({selectedMonth})</span>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm mb-3">Jobs Completed ({summary.entryCount})</h4>
                                            {summary.entryCount === 0 ? <p className="text-sm text-gray-400 italic">No completed jobs this period.</p> : (
                                                <div className="space-y-2">
                                                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm text-gray-500">
                                                        Detailed job breakdown available in Time Tracking.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm mb-3">Payments Received ({summary.paymentCount})</h4>
                                            {summary.paymentCount === 0 ? <p className="text-sm text-gray-400 italic">No payments recorded this period.</p> : (
                                                <div className="space-y-2">
                                                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm text-emerald-700 font-medium flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4" /> {summary.paymentCount} payments processed.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {(!data?.summaries || data.summaries.length === 0) && (
                        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                            <p className="text-gray-400 font-medium">No cleaner data found for this period.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Pay Modal */}
            {payModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Record Payment</h3>
                        <p className="text-sm text-gray-500 mb-6">Pay <span className="font-bold text-gray-800">{payModalOpen.name}</span></p>

                        <form onSubmit={handlePay} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount ($)</label>
                                <input
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    defaultValue={payModalOpen.balance}
                                    autoFocus
                                    className="w-full text-2xl font-bold p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#163022]/20 focus:border-[#163022] outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Note (Optional)</label>
                                <input
                                    name="description"
                                    placeholder="e.g. Weekly Payout"
                                    className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#163022]/20 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setPayModalOpen(null)}
                                    className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={recordPaymentMutation.isPending}
                                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#163022] hover:bg-[#0f241a] transition-colors shadow-lg shadow-[#163022]/20 flex items-center gap-2"
                                >
                                    {recordPaymentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Confirm Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
