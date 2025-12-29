import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "~/components/admin/AdminShell";
import { useTRPC } from "~/trpc/react";
import { formatCurrency } from "~/utils/formatCurrency";
import { useState, useMemo } from "react";
import { Search, Filter, UserPlus, CheckCircle, Clock, DollarSign, MapPin } from "lucide-react";

export const Route = createFileRoute("/admin-portal/signups")({
    component: SignupsPage,
});

function SignupsPage() {
    const trpc = useTRPC();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const submissionsQuery = useQuery(trpc.getQuizSubmissions.queryOptions());

    const submissions = useMemo(() => submissionsQuery.data || [], [submissionsQuery.data]);

    const filteredSubmissions = useMemo(() => {
        return submissions.filter((sub) => {
            if (statusFilter !== "ALL" && sub.status !== statusFilter) return false;

            const term = search.toLowerCase();
            const matchesSearch =
                (sub.fullName?.toLowerCase() || "").includes(term) ||
                (sub.email?.toLowerCase() || "").includes(term) ||
                (sub.phone?.toLowerCase() || "").includes(term);

            return matchesSearch;
        });
    }, [submissions, statusFilter, search]);

    // Stats
    const confirmedCount = submissions.filter(s => s.status === "confirmed").length;
    const pendingCount = submissions.filter(s => s.status === "payment_pending").length;
    const totalValue = submissions.filter(s => s.finalTotalCents).reduce((sum, s) => sum + (s.finalTotalCents || 0), 0);

    return (
        <AdminShell
            title="Online Signups"
            subtitle="Track quiz submissions and booking conversions"
        >
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{submissions.length}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-slate-500" />
                        </div>
                    </div>
                </div>
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Confirmed</p>
                            <p className="text-2xl font-black text-emerald-600 mt-1">{confirmedCount}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                        </div>
                    </div>
                </div>
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Pending</p>
                            <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-amber-500" />
                        </div>
                    </div>
                </div>
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Value</p>
                            <p className="text-2xl font-black text-[#163022] mt-1">{formatCurrency(totalValue / 100)}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-[#163022]/10 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-[#163022]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="premium-card !p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 focus-within:border-[#163022] focus-within:bg-white transition-all">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, email, phone..."
                            className="w-48 bg-transparent text-sm font-medium focus:outline-none placeholder:text-slate-400"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 focus:border-[#163022] focus:outline-none"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="started">Started</option>
                        <option value="payment_pending">Payment Pending</option>
                        <option value="confirmed">Confirmed</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="premium-card !p-0 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimate</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredSubmissions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center">
                                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                        <UserPlus className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <p className="text-lg font-bold text-slate-900">No signups found</p>
                                    <p className="text-slate-400 mt-1">Quiz submissions will appear here</p>
                                </td>
                            </tr>
                        ) : filteredSubmissions.map((sub) => (
                            <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5 text-sm text-slate-500 whitespace-nowrap">
                                    {new Date(sub.createdAt).toLocaleDateString()}
                                    <div className="text-xs text-slate-400 mt-0.5">
                                        {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#163022] to-[#264e3c] text-white flex items-center justify-center font-bold text-xs">
                                            {(sub.fullName || "U").slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{sub.fullName || "Unknown"}</div>
                                            <div className="text-xs text-slate-500">{sub.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1 text-xs">
                                        {sub.cleanType && (
                                            <span className="inline-flex w-fit px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-bold uppercase text-[10px]">
                                                {sub.cleanType}
                                            </span>
                                        )}
                                        <span className="text-slate-600">
                                            {sub.bedrooms ? `${sub.bedrooms} Bed` : ""} {sub.bathrooms ? `• ${sub.bathrooms} Bath` : ""}
                                        </span>
                                        <span className="flex items-center gap-1 text-slate-400">
                                            <MapPin className="h-3 w-3" />
                                            {sub.city ? `${sub.city}` : "No address"}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-lg font-black text-[#163022]">
                                        {sub.finalTotalCents ? formatCurrency(sub.finalTotalCents / 100) : "-"}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${sub.status === "confirmed" ? "bg-emerald-50 text-emerald-600" :
                                            sub.status === "payment_pending" ? "bg-amber-50 text-amber-600" :
                                                "bg-slate-100 text-slate-500"
                                        }`}>
                                        {sub.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminShell>
    );
}
