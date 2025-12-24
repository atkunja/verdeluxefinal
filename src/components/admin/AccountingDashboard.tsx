import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";

type NewEntry = {
  date: string;
  description: string;
  amount: number;
  category: "INCOME" | "EXPENSE" | "ASSET" | "LIABILITY" | "EQUITY";
};

export function AccountingDashboard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const entriesQuery = useQuery(trpc.accounting.getAccountingEntries.queryOptions());

  const createMutation = useMutation(
    trpc.accounting.createAccountingEntry.mutationOptions({
      onSuccess: () => {
        toast.success("Entry added");
        queryClient.invalidateQueries({ queryKey: trpc.accounting.getAccountingEntries.queryKey() });
      },
      onError: (err) => toast.error(err.message || "Failed to add entry"),
    })
  );

  const deleteMutation = useMutation(
    trpc.accounting.deleteAccountingEntry.mutationOptions({
      onSuccess: () => {
        toast.success("Entry deleted");
        queryClient.invalidateQueries({ queryKey: trpc.accounting.getAccountingEntries.queryKey() });
      },
      onError: (err) => toast.error(err.message || "Failed to delete entry"),
    })
  );

  const [newEntry, setNewEntry] = useState<NewEntry>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: 0,
    category: "INCOME",
  });

  const totals = entriesQuery.data?.reduce(
    (acc: Record<string, number>, e: any) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    },
    {} as Record<string, number>
  ) ?? {};

  const handleAdd = () => {
    if (!newEntry.description || !newEntry.date) {
      toast.error("Date and description are required");
      return;
    }
    createMutation.mutate({
      ...newEntry,
      date: new Date(newEntry.date),
    });
  };

  const handleExportCsv = () => {
    if (!entriesQuery.data) return;
    const rows = entriesQuery.data.map((e: any) => ({
      date: new Date(e.date).toISOString(),
      description: e.description,
      category: e.category,
      amount: e.amount,
      relatedBookingId: e.relatedBookingId ?? "",
    }));
    const header = "date,description,category,amount,relatedBookingId";
    const csv = [header, ...rows.map((r) => `${r.date},${r.description},${r.category},${r.amount},${r.relatedBookingId}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "accounting-entries.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-primary uppercase">Finance</p>
          <h3 className="text-lg font-bold text-gray-900">Accounting Dashboard</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            {["INCOME", "EXPENSE", "ASSET", "LIABILITY", "EQUITY"].map((cat) => (
              <div key={cat} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <p className="font-semibold">{cat}</p>
                <p className="text-sm">
                  ${((totals as any)[cat] ?? 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* New Entry Form */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g., Booking payout, cleaning supplies"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={newEntry.amount}
              onChange={(e) => setNewEntry({ ...newEntry, amount: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Category</label>
            <select
              value={newEntry.category}
              onChange={(e) =>
                setNewEntry({ ...newEntry, category: e.target.value as NewEntry["category"] })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="ASSET">Asset</option>
              <option value="LIABILITY">Liability</option>
              <option value="EQUITY">Equity</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-dark transition disabled:opacity-60"
          >
            Add Entry
          </button>
        </div>

        {/* Entries */}
        {entriesQuery.isLoading ? (
          <div className="text-sm text-gray-600">Loading entries...</div>
        ) : entriesQuery.isError ? (
          <div className="text-sm text-red-600">Failed to load entries.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-700 font-semibold">Date</th>
                  <th className="px-3 py-2 text-left text-gray-700 font-semibold">Description</th>
                  <th className="px-3 py-2 text-left text-gray-700 font-semibold">Category</th>
                  <th className="px-3 py-2 text-left text-gray-700 font-semibold">Amount</th>
                  <th className="px-3 py-2 text-right text-gray-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entriesQuery.data?.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{entry.description}</td>
                    <td className="px-3 py-2">{entry.category}</td>
                    <td className="px-3 py-2">${entry.amount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => deleteMutation.mutate({ id: entry.id })}
                        className="text-red-600 text-sm hover:underline"
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entriesQuery.data?.length === 0 && (
              <p className="text-sm text-gray-600 mt-2">No accounting entries yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
