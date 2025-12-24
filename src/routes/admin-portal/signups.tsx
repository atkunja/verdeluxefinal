import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "~/components/admin/AdminShell";
import { useTRPC } from "~/trpc/react";
import { formatCurrency } from "~/utils/formatCurrency";
import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";

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
            const matchesStatus = statusFilter === "ALL" || (statusFilter === "confirmed" ? sub.status === "confirmed" : sub.status !== "confirmed");
            // If filter is specific, match exact. If 'ALL', show all. 
            // Actually let's do a simpler status filter:
            if (statusFilter !== "ALL" && sub.status !== statusFilter) return false;

            const term = search.toLowerCase();
            const matchesSearch =
                (sub.fullName?.toLowerCase() || "").includes(term) ||
                (sub.email?.toLowerCase() || "").includes(term) ||
                (sub.phone?.toLowerCase() || "").includes(term);

            return matchesSearch;
        });
    }, [submissions, statusFilter, search]);

    return (
        <AdminShell
            title="Online Signups"
            subtitle="Log of 'Book Now' quiz submissions."
        >
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                    <Search className="mr-2 h-4 w-4 text-gray-500" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, email, phone"
                        className="w-56 bg-transparent text-sm focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent focus:outline-none"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="started">Started</option>
                        <option value="payment_pending">Payment Pending</option>
                        <option value="confirmed">Confirmed</option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#f9fafb] text-left text-xs font-semibold text-gray-600">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Customer</th>
                            <th className="px-4 py-3">Details</th>
                            <th className="px-4 py-3">Estimate</th>
                            <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {filteredSubmissions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    No signups found.
                                </td>
                            </tr>
                        ) : filteredSubmissions.map((sub) => (
                            <tr key={sub.id} className="hover:bg-[#f9fafb]">
                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                    {new Date(sub.createdAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-semibold text-[#0f172a]">{sub.fullName || "Unknown"}</div>
                                    <div className="text-xs text-gray-500">{sub.email}</div>
                                    <div className="text-xs text-gray-500">{sub.phone}</div>
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                    <div className="flex flex-col gap-0.5 text-xs">
                                        {sub.cleanType && <span className="font-medium">{sub.cleanType}</span>}
                                        <span>{sub.bedrooms ? `${sub.bedrooms} Bed` : ""} {sub.bathrooms ? `• ${sub.bathrooms} Bath` : ""}</span>
                                        <span className="text-gray-400 capitalize">{sub.city ? `${sub.addressLine1 || ""}, ${sub.city}` : "No address"}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                                    {sub.finalTotalCents ? formatCurrency(sub.finalTotalCents / 100) : "-"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${sub.status === "confirmed" ? "bg-green-100 text-green-700" :
                                            sub.status === "payment_pending" ? "bg-yellow-100 text-yellow-700" :
                                                "bg-gray-100 text-gray-700"
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
