
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { AdminShell } from "~/components/admin/AdminShell";
import { ArrowDown, ArrowUp, Calendar, CreditCard, Download, RefreshCw, TrendingUp } from "lucide-react";
import { toast } from "react-hot-toast";
import { json2csv } from "json-2-csv";


export const Route = createFileRoute("/admin-portal/finance/")({
    component: FinancePage,
});

function FinancePage() {
    const trpc = useTRPC();
    // const utils = trpc.useUtils();
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of month
        end: new Date()
    });

    const statsQuery = useQuery(trpc.accounting.getProfitAndLoss.queryOptions({
        startDate: dateRange.start,
        endDate: dateRange.end
    }));

    const syncMutation = useMutation(
        trpc.accounting.syncMercuryTransactions.mutationOptions({
            onSuccess: (data) => {
                toast.success(`Synced ${data.count} transactions`);
                statsQuery.refetch();
            },
            onError: (err) => {
                toast.error(`Sync failed: ${err.message}`);
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

    const StatCard = ({ label, value, type }: { label: string, value: number, type: 'income' | 'expense' | 'net' }) => (
        <div className="p-6 rounded-3xl border border-white/40 bg-white/60 shadow-sm backdrop-blur-md">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</div>
            <div className={`text-3xl font-bold ${type === 'income' ? 'text-emerald-700' :
                type === 'expense' ? 'text-rose-700' :
                    value >= 0 ? 'text-[#163022]' : 'text-rose-700'
                }`}>
                ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
        </div>
    );

    return (
        <AdminShell title="Financial Overview" subtitle="Track revenue and expenses">
            <div className="grid gap-6">
                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center rounded-3xl border border-white/40 bg-white/60 p-4 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={dateRange.start.toISOString().split('T')[0]}
                                onChange={e => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                                className="border-none p-0 text-sm font-bold text-gray-700 focus:ring-0"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={dateRange.end.toISOString().split('T')[0]}
                                onChange={e => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                                className="border-none p-0 text-sm font-bold text-gray-700 focus:ring-0"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => syncMutation.mutate()}
                            disabled={syncMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                            Sync Bank
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-[#163022] text-white rounded-xl font-bold text-sm hover:bg-[#10271b] transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Total Revenue" value={statsQuery.data?.totalIncome || 0} type="income" />
                    <StatCard label="Total Expenses" value={statsQuery.data?.totalExpense || 0} type="expense" />
                    <StatCard label="Net Profit" value={statsQuery.data?.netProfit || 0} type="net" />
                </div>

                {/* Progress Visual */}
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

                {/* Transaction Table */}
                <div className="bg-white rounded-3xl border border-white/40 shadow-sm p-6 backdrop-blur-md">
                    <h3 className="text-lg font-bold text-[#0f172a] mb-4">Transactions</h3>
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
                                            {new Date(entry.date).toLocaleDateString()}
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
                                                {entry.expense?.receiptUrl && (
                                                    <a href={entry.expense.receiptUrl} target="_blank" className="text-[10px] text-emerald-600 hover:underline">
                                                        Receipt
                                                    </a>
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
                            <div className="text-center py-12 text-gray-400 text-sm">
                                No transactions found for this period
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
