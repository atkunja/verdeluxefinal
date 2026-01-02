import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { AdminShell } from "~/components/admin/AdminShell";
import {
    ArrowDown, ArrowUp, Calendar, CreditCard, Download,
    RefreshCw, TrendingUp, DollarSign, Users, Briefcase,
    ChevronRight, AlertCircle, CheckCircle, Wallet
} from "lucide-react";
import { toast } from "react-hot-toast";
import { json2csv } from "json-2-csv";
import { format } from "date-fns";

export const Route = createFileRoute("/admin-portal/finance/")({
    component: FinancePage,
});

type TabType = 'overview' | 'transactions' | 'payouts';

function FinancePage() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date()
    });

    // Queries
    const statsQuery = useQuery(trpc.accounting.getProfitAndLoss.queryOptions({
        startDate: dateRange.start,
        endDate: dateRange.end
    }));

    const payoutSummaryQuery = useQuery(trpc.getPayoutSummary.queryOptions({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
    }, { enabled: activeTab === 'payouts' }));

    // Mutations
    const syncMutation = useMutation(
        trpc.mercury.syncTransactions.mutationOptions({
            onSuccess: (data: any) => {
                toast.success(`Synced ${data.count} transactions`);
                statsQuery.refetch();
            },
            onError: (err: any) => {
                toast.error(`Sync failed: ${err.message}`);
            }
        })
    );

    const triggerPayoutMutation = useMutation(
        trpc.mercury.triggerPayout.mutationOptions({
            onSuccess: () => {
                toast.success("Payout triggered successfully");
                payoutSummaryQuery.refetch();
            },
            onError: (err: any) => {
                toast.error(`Payout failed: ${err.message}`);
            }
        })
    );

    const handleExport = () => {
        if (!statsQuery.data?.entries) return;
        const csv = json2csv(statsQuery.data.entries);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance_export_${dateRange.start.toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handlePayout = (cleanerId: number, amount: number) => {
        if (!window.confirm(`Are you sure you want to trigger a payout of $${amount.toFixed(2)}?`)) return;
        // Placeholder account ID - in prod this would come from a setting or dropdown
        triggerPayoutMutation.mutate({
            cleanerId,
            amount,
            mercuryAccountId: "default_account",
            note: `Manual payout for period ${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')}`
        });
    };

    const StatCard = ({ label, value, type, icon: Icon }: { label: string, value: number, type: 'income' | 'expense' | 'net', icon?: any }) => (
        <div className="p-6 rounded-3xl border border-white/40 bg-white/60 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</div>
                {Icon && <Icon className="w-4 h-4 text-gray-300" />}
            </div>
            <div className={`text-3xl font-bold ${type === 'income' ? 'text-emerald-700' :
                type === 'expense' ? 'text-rose-700' :
                    value >= 0 ? 'text-[#163022]' : 'text-rose-700'
                }`}>
                ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
        </div>
    );

    return (
        <AdminShell title="Finance Dashboard" subtitle="Manage revenue, expenses, and cleaner payouts">
            <div className="grid gap-6">
                {/* Header & Controls */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center rounded-3xl border border-white/40 bg-white/60 p-4 shadow-sm backdrop-blur-md">
                    <div className="flex bg-gray-100/50 p-1 rounded-2xl w-full lg:w-auto">
                        {(['overview', 'transactions', 'payouts'] as TabType[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab
                                    ? 'bg-white text-[#163022] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={dateRange.start.toISOString().split('T')[0]}
                                onChange={e => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                                className="border-none p-0 text-sm font-bold text-gray-700 focus:ring-0 w-28"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={dateRange.end.toISOString().split('T')[0]}
                                onChange={e => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                                className="border-none p-0 text-sm font-bold text-gray-700 focus:ring-0 w-28"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            {activeTab !== 'payouts' && (
                                <button
                                    onClick={() => syncMutation.mutate()}
                                    disabled={syncMutation.isPending}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                                    <span className="hidden sm:inline">Sync Bank</span>
                                </button>
                            )}
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 bg-[#163022] text-white rounded-xl font-bold text-sm hover:bg-[#10271b] transition-colors shadow-lg shadow-[#163022]/10"
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Export CSV</span>
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard label="Total Revenue" value={statsQuery.data?.totalIncome || 0} type="income" icon={ArrowUp} />
                            <StatCard label="Total Expenses" value={statsQuery.data?.totalExpense || 0} type="expense" icon={ArrowDown} />
                            <StatCard label="Net Profit" value={statsQuery.data?.netProfit || 0} type="net" icon={TrendingUp} />
                        </div>

                        {statsQuery.data && statsQuery.data.totalIncome > 0 && (
                            <div className="p-6 rounded-3xl border border-white/40 bg-white/60 shadow-sm backdrop-blur-md">
                                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-2">
                                    <span>Expense Ratio</span>
                                    <span>{Math.round((statsQuery.data.totalExpense / statsQuery.data.totalIncome) * 100)}%</span>
                                </div>
                                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-rose-500 transition-all duration-500"
                                        style={{ width: `${Math.min(100, (statsQuery.data.totalExpense / statsQuery.data.totalIncome) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'transactions' && (
                    <div className="bg-white rounded-3xl border border-white/40 shadow-sm p-6 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-[#0f172a]">Transaction History</h3>
                            <div className="text-xs text-gray-400 font-bold uppercase">{statsQuery.data?.entries.length || 0} entries</div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-gray-500 uppercase border-b border-gray-100">
                                        <th className="pb-3 pl-4">Date</th>
                                        <th className="pb-3">Description</th>
                                        <th className="pb-3 text-right pr-4">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {statsQuery.data?.entries.map((entry: any) => (
                                        <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 pl-4 text-sm font-medium text-gray-900">
                                                {format(new Date(entry.date), 'MMM d, yyyy')}
                                            </td>
                                            <td className="py-4 text-sm text-gray-500">
                                                <div className="font-bold text-gray-800">
                                                    {entry.expense?.vendor || entry.description}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {entry.category}
                                                    </span>
                                                    {entry.mercuryTransaction && (
                                                        <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded">
                                                            Synced
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={`py-4 pr-4 text-sm font-bold text-right ${entry.category === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                                                }`}>
                                                {entry.category === 'INCOME' ? '+' : '-'}${entry.amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(!statsQuery.data?.entries || statsQuery.data.entries.length === 0) && (
                                <div className="text-center py-12 text-gray-400 text-sm italic">
                                    No transactions found for this period
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'payouts' && (
                    <div className="bg-white rounded-3xl border border-white/40 shadow-sm p-6 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-[#0f172a]">Cleaner Payouts</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Calculated based on verified time logs</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">ACH Processing</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-gray-500 uppercase border-b border-gray-100">
                                        <th className="pb-3 pl-4">Cleaner</th>
                                        <th className="pb-3">Work Summary</th>
                                        <th className="pb-3 text-right">Owed</th>
                                        <th className="pb-3 text-right">Paid</th>
                                        <th className="pb-3 text-right pr-4">Balance</th>
                                        <th className="pb-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {payoutSummaryQuery.data?.summaries.map((s: any) => (
                                        <tr key={s.cleanerId} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 pl-4">
                                                <div className="text-sm font-bold text-gray-900">{s.name}</div>
                                                <div className="text-[10px] text-gray-500">{s.email}</div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-sm text-gray-700">{s.totalHours} hrs</span>
                                                    <span className="text-[10px] text-gray-400">({s.entryCount} jobs)</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-sm font-bold text-right text-gray-900">${s.totalOwed.toFixed(2)}</td>
                                            <td className="py-4 text-sm font-medium text-right text-emerald-600">${s.totalPaid.toFixed(2)}</td>
                                            <td className="py-4 text-sm font-extrabold text-right text-[#163022] pr-4">${s.balance.toFixed(2)}</td>
                                            <td className="py-4 text-center">
                                                {s.balance > 0 ? (
                                                    <button
                                                        onClick={() => handlePayout(s.cleanerId, s.balance)}
                                                        disabled={triggerPayoutMutation.isPending}
                                                        className="px-3 py-1.5 bg-[#163022] text-white rounded-lg text-xs font-bold hover:bg-[#10271b] transition-all flex items-center gap-1 mx-auto"
                                                    >
                                                        <Wallet className="w-3 h-3" />
                                                        Pay via Mercury
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1 text-emerald-600 text-[10px] font-bold uppercase">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Paid
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {payoutSummaryQuery.isLoading && (
                                <div className="text-center py-12">
                                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
                                    <p className="text-xs text-gray-500 italic">Calculating payouts...</p>
                                </div>
                            )}
                            {(!payoutSummaryQuery.data?.summaries || payoutSummaryQuery.data.summaries.length === 0) && !payoutSummaryQuery.isLoading && (
                                <div className="text-center py-12 text-gray-400 text-sm italic">
                                    No active cleaners with logs found
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}
