import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminShell } from "~/components/admin/AdminShell";
import { Account, Transaction, PaymentOwed, mockCategories } from "~/mocks/adminPortal";
import { listAccounts, listTransactions, listPaymentsOwed } from "~/api/adminPortal";
import { ArrowDownRight, ArrowUpRight, CreditCard, Filter, RefreshCcw, Settings, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { useTRPC } from "~/trpc/react";
import { Download } from "lucide-react";
import { json2csv } from "json-2-csv";
const mockSubCategories = ["Marketing", "Software", "Supplies", "Rent", "Misc"];

export const Route = createFileRoute("/admin-portal/bank-transactions")({
  component: BankTransactionsPage,
});

type TxTab = "all" | "posted" | "pending" | "excluded";
type BankView = "transactions" | "payments";

function BankTransactionsPage() {
  const trpc = useTRPC();
  const entriesQuery = useQuery(trpc.accounting.getAccountingEntries.queryOptions());
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<PaymentOwed[]>([]);
  const [tab, setTab] = useState<TxTab>("all");
  const [categoryEdit, setCategoryEdit] = useState<Record<string, string>>({});
  const [subCategoryEdit, setSubCategoryEdit] = useState<Record<string, string>>({});
  const [approvedMap, setApprovedMap] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<BankView>("transactions");
  const [paymentFilter, setPaymentFilter] = useState<{ method: string; status: string }>({ method: "ALL", status: "ALL" });
  const txStatusMutation = useMutation(trpc.payments.updateTransactionStatus.mutationOptions());
  const txCategoryMutation = useMutation(trpc.payments.updateTransactionCategory.mutationOptions());
  const payoutMutation = useMutation(trpc.payments.initiateAchPayout.mutationOptions());
  const syncMercuryMutation = useMutation(trpc.accounting.syncMercuryTransactions.mutationOptions());

  const accountsQuery = useQuery(trpc.accounting.listAccounts.queryOptions(undefined, { staleTime: 60000 }));
  const transactionsQuery = useQuery(trpc.accounting.listTransactions.queryOptions(undefined, { staleTime: 30000 }));

  console.log("BankTransactionsPage render", { accounts: accounts.length, transactions: transactions.length });

  useEffect(() => {
    console.log("Accounts Effect run", { data: accountsQuery.data, isLoading: accountsQuery.isLoading });
    const remoteAccounts = accountsQuery.data?.accounts;

    // Only update if we have actual remote data (even if empty list, it's valid remote response)
    if (remoteAccounts && Array.isArray(remoteAccounts)) {
      console.log("Setting accounts from query data", remoteAccounts.length);
      setAccounts(
        remoteAccounts.map((acc: any) => ({
          id: acc.id || acc.external_id || acc.account_id || acc.name,
          institution: "Mercury",
          name: acc.name || acc.account_name || "Account",
          last4: acc.mask || acc.last4 || (acc.id ? acc.id.slice(-4) : "0000"),
          postedBalance: Number(acc.balance ?? acc.posted_balance ?? 0),
          availableBalance: Number(acc.available_balance ?? acc.balance ?? 0),
          lastSynced: new Date().toISOString(),
        }))
      );
    }
  }, [accountsQuery.data]);

  useEffect(() => {
    console.log("Transactions Effect run", { data: transactionsQuery.data });
    const remoteTx = transactionsQuery.data?.transactions;

    if (remoteTx && Array.isArray(remoteTx)) {
      console.log("Setting transactions from query data", remoteTx.length);
      setTransactions(
        remoteTx.map((t: any) => ({
          id: t.externalId || t.id?.toString() || Math.random().toString(36).slice(2),
          accountId: t.accountId || t.account_id || "unknown",
          date: (t.transactionAt || t.date || t.created_at || "").toString().slice(0, 10),
          description: t.description || t.memo || "Transaction",
          accountName: t.accountName || t.account || "Account",
          category: t.category || "Uncategorized",
          amount: Number(t.amount ?? t.debit ?? 0) || 0,
          status: (t.status as Transaction["status"]) || "posted",
        }))
      );
    }
  }, [transactionsQuery.data]);

  useEffect(() => {
    console.log("Payments Effect run");
    listPaymentsOwed().then(setPayments);
  }, []);

  const summary = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.postedBalance, 0);
    const availableBalance = accounts.reduce((sum, acc) => sum + acc.availableBalance, 0);
    return { totalBalance, availableBalance, activeAccounts: accounts.length };
  }, [accounts]);

  const filteredTransactions = useMemo(() => {
    if (tab === "all") return transactions;
    return transactions.filter((tx) => tx.status === tab);
  }, [transactions, tab]);
  const setTxStatus = (id: string, status: Transaction["status"]) => {
    txStatusMutation.mutate(
      { id, status },
      {
        onSuccess: () => {
          void transactionsQuery.refetch();
          setApprovedMap((prev) => ({ ...prev, [id]: status === "posted" }));
          toast.success(`Marked ${status}`);
        },
        onError: (err) => toast.error(err.message || "Update failed"),
      }
    );
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const methodMatch = paymentFilter.method === "ALL" || p.paymentMethod === paymentFilter.method;
      const statusMatch = paymentFilter.status === "ALL" || p.status === paymentFilter.status;
      return methodMatch && statusMatch;
    });
  }, [payments, paymentFilter]);

  const updatePaymentStatus = (id: string, status: PaymentOwed["status"]) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    toast.success(`Marked ${status}`);
  };

  const handleCategoryChange = (id: string, category: string) => {
    setCategoryEdit((prev) => ({ ...prev, [id]: category }));
    setTransactions((prev) => prev.map((tx) => (tx.id === id ? { ...tx, category } : tx)));
  };

  const openPlaceholder = (label: string) => {
    window.alert(`${label} (stub)`);
  };

  return (
    <AdminShell
      title="Bank Transactions"
      subtitle="Mercury integration."
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1 text-sm">
            <button
              onClick={() => setView("transactions")}
              className={`rounded-lg px-3 py-1.5 font-semibold ${view === "transactions" ? "bg-[#163022] text-white" : "text-gray-700"}`}
            >
              Transactions
            </button>
            <button
              onClick={() => setView("payments")}
              className={`rounded-lg px-3 py-1.5 font-semibold ${view === "payments" ? "bg-[#163022] text-white" : "text-gray-700"}`}
            >
              Payments
            </button>
          </div>
          <button
            onClick={() => toast("Category management coming soon", { icon: "🛠️" })}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
            Manage Categories
          </button>
          <button
            onClick={() => {
              const dataToExport = view === "transactions" ? filteredTransactions : filteredPayments;
              if (!dataToExport || dataToExport.length === 0) {
                toast.error("No data to export");
                return;
              }
              const csv = json2csv(dataToExport);
              const blob = new Blob([csv], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.setAttribute("hidden", "");
              a.setAttribute("href", url);
              a.setAttribute("download", `v_luxe_${view}_${new Date().toISOString().split("T")[0]}.csv`);
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              toast.success(`Exported ${dataToExport.length} rows`);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => {
              const t = toast.loading("Syncing with Mercury...");
              syncMercuryMutation.mutate(undefined, {
                onSuccess: (res: any) => {
                  if (res.success) {
                    toast.success(`Sync complete! ${res.count} transactions fetched.`, { id: t });
                    void accountsQuery.refetch();
                    void transactionsQuery.refetch();
                  } else {
                    toast.error(`Sync failed: ${res.error}`, { id: t });
                  }
                },
                onError: (err: any) => {
                  toast.error(`Sync error: ${err.message}`, { id: t });
                }
              });
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#163022] px-3 py-2 text-sm font-semibold text-white shadow hover:bg-[#0f241a]"
          >
            <RefreshCcw className="h-4 w-4" />
            Sync Transactions
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total Balance" value={summary.totalBalance} icon={<CreditCard className="h-5 w-5" />} />
        <SummaryCard label="Available Balance" value={summary.availableBalance} icon={<ArrowUpRight className="h-5 w-5 text-green-600" />} />
        <SummaryCard label="Active Accounts" value={summary.activeAccounts} format="number" icon={<Filter className="h-5 w-5 text-gray-600" />} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="premium-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Accounts</h3>
            <button
              onClick={() => toast("Rules engine coming soon", { icon: "🧠" })}
              className="h-8 px-3 rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
            >
              Manage Rules
            </button>
          </div>
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-4 hover:border-slate-200 transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {acc.institution} • {acc.name}
                  </div>
                  <div className="text-xs text-slate-500">•••• {acc.last4}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Synced {new Date(acc.lastSynced).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-[#163022]">
                    ${acc.postedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500">
                    Available ${acc.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {view === "transactions" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="font-semibold">Filters:</span>
              <div className="flex gap-2 rounded-xl border border-gray-200 bg-[#f9fafb] p-1">
                {(["all", "posted", "pending", "excluded"] as TxTab[]).map((tabKey) => (
                  <button
                    key={tabKey}
                    onClick={() => setTab(tabKey)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === tabKey ? "bg-[#163022] text-white" : "text-gray-700"
                      }`}
                  >
                    {tabKey[0].toUpperCase() + tabKey.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 max-h-[420px] overflow-y-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="sticky top-0 bg-white text-[11px] text-gray-600">
                  <tr>
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Description</th>
                    <th className="px-2 py-2">Account</th>
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#f9fafb]">
                      <td className="px-2 py-2">{tx.date}</td>
                      <td className="px-2 py-2">{tx.description}</td>
                      <td className="px-2 py-2">{tx.accountName}</td>
                      <td className="px-2 py-2">
                        <select
                          value={categoryEdit[tx.id] || tx.category}
                          onChange={(e) => {
                            handleCategoryChange(tx.id, e.target.value);
                            txCategoryMutation.mutate(
                              { id: tx.id, category: e.target.value, subCategory: subCategoryEdit[tx.id] },
                              {
                                onSuccess: () => {
                                  toast.success("Category saved");
                                  void transactionsQuery.refetch();
                                },
                                onError: (err) => toast.error(err.message || "Save failed"),
                              }
                            );
                          }}
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                        >
                          {mockCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={subCategoryEdit[tx.id] || "Uncategorized"}
                          onChange={(e) => {
                            setSubCategoryEdit((prev) => ({ ...prev, [tx.id]: e.target.value }));
                            txCategoryMutation.mutate(
                              { id: tx.id, category: categoryEdit[tx.id] || tx.category, subCategory: e.target.value },
                              {
                                onSuccess: () => toast.success("Sub-category saved"),
                                onError: (err) => toast.error(err.message || "Save failed"),
                              }
                            );
                          }}
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                        >
                          <option>Uncategorized</option>
                          {mockSubCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-semibold ${tx.amount < 0 ? "text-red-600" : "text-green-700"
                          }`}
                      >
                        {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right capitalize text-gray-700">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs">{tx.status}</span>
                          <button
                            onClick={() => setTxStatus(tx.id, "posted")}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] text-green-700 hover:bg-green-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setTxStatus(tx.id, "excluded")}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] text-amber-700 hover:bg-amber-50"
                          >
                            Exclude
                          </button>
                          <button
                            onClick={() =>
                              payoutMutation.mutate(
                                { paymentIds: [tx.id] },
                                {
                                  onSuccess: () => toast.success("ACH payout initiated"),
                                  onError: (err) => toast.error(err.message || "ACH failed"),
                                }
                              )
                            }
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] text-blue-700 hover:bg-blue-50"
                          >
                            ACH
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-[#0f172a]">Cleaner Payments</div>
              <button
                onClick={() => toast("Bulk payouts coming soon", { icon: "💸" })}
                className="inline-flex items-center gap-2 rounded-lg bg-[#163022] px-3 py-2 text-xs font-semibold text-white shadow hover:bg-[#0f241a]"
              >
                <Wallet className="h-4 w-4" />
                Run Payouts
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
              <select
                value={paymentFilter.method}
                onChange={(e) => setPaymentFilter((prev) => ({ ...prev, method: e.target.value }))}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1"
              >
                <option value="ALL">All methods</option>
                <option value="ACH">ACH</option>
                <option value="Check">Check</option>
                <option value="Cash">Cash</option>
              </select>
              <select
                value={paymentFilter.status}
                onChange={(e) => setPaymentFilter((prev) => ({ ...prev, status: e.target.value }))}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1"
              >
                <option value="ALL">All statuses</option>
                <option value="owed">Owed</option>
                <option value="in_process">In Process</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="mt-3 max-h-[420px] overflow-y-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="sticky top-0 bg-white text-[11px] text-gray-600">
                  <tr>
                    <th className="px-2 py-2">Service Date</th>
                    <th className="px-2 py-2">Cleaner</th>
                    <th className="px-2 py-2">Booking</th>
                    <th className="px-2 py-2">Method</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#f9fafb]">
                      <td className="px-2 py-2">{p.serviceDate}</td>
                      <td className="px-2 py-2">{p.cleaner}</td>
                      <td className="px-2 py-2">{p.bookingId}</td>
                      <td className="px-2 py-2">{p.paymentMethod}</td>
                      <td className="px-2 py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${p.status === "owed"
                            ? "bg-amber-50 text-amber-700"
                            : p.status === "in_process"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-green-50 text-green-700"
                            }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right font-semibold text-[#0f172a]">
                        ${p.amount.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex justify-end gap-2 text-[11px]">
                          <button
                            onClick={() => updatePaymentStatus(p.id, "owed")}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            Owed
                          </button>
                          <button
                            onClick={() => updatePaymentStatus(p.id, "in_process")}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"
                          >
                            In Process
                          </button>
                          <button
                            onClick={() => {
                              updatePaymentStatus(p.id, "paid");
                              toast.success("Marked paid");
                            }}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-green-700 hover:bg-green-50"
                          >
                            Paid
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  format = "currency",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  format?: "currency" | "number";
}) {
  const formatted =
    format === "currency"
      ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      : value.toString();
  return (
    <div className="premium-card !p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatted}</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-[#163022]/10 flex items-center justify-center text-[#163022]">{icon}</div>
      </div>
    </div>
  );
}
