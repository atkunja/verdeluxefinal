import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "~/components/admin/AdminShell";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/admin-portal/revenue-reports")({
  component: RevenueReportsPage,
});

function RevenueReportsPage() {
  const trpc = useTRPC();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  });

  const metricsQuery = useQuery(trpc.accounting.getRevenueMetrics.queryOptions({
    startDate: dateRange.start,
    endDate: dateRange.end
  }));

  const metrics = (metricsQuery.data || []) as { key: string, value: number }[];

  return (
    <AdminShell
      title="Revenue Reports"
      subtitle="Financial snapshots and performance tracking."
      actions={
        <div className="flex items-center gap-3 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
          <input
            type="date"
            value={dateRange.start.toISOString().split('T')[0]}
            onChange={(e) => {
              const d = new Date(e.target.value);
              if (!isNaN(d.getTime())) setDateRange(prev => ({ ...prev, start: d }));
            }}
            className="rounded-xl border-none bg-transparent hover:bg-slate-50 transition-colors px-4 py-2 text-xs font-bold text-slate-600 focus:ring-0"
          />
          <div className="h-4 w-px bg-slate-100" />
          <input
            type="date"
            value={dateRange.end.toISOString().split('T')[0]}
            onChange={(e) => {
              const d = new Date(e.target.value);
              if (!isNaN(d.getTime())) setDateRange(prev => ({ ...prev, end: d }));
            }}
            className="rounded-xl border-none bg-transparent hover:bg-slate-50 transition-colors px-4 py-2 text-xs font-bold text-slate-600 focus:ring-0"
          />
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="premium-card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 leading-none">Revenue Analytics</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Billed & Recurring Income</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <RevenueTable
            rows={[
              { label: "Billed Total Revenue", value: metrics.find((m: any) => m.key === "billedRevenue")?.value || 0, isCurrency: true },
              { label: "Pending Payments", value: metrics.find((m: any) => m.key === "pendingPayments")?.value || 0, isCurrency: true },
              { label: "Recurring", value: metrics.find((m: any) => m.key === "recurringRevenue")?.value || 0, isCurrency: true },
              { label: "Monthly", value: metrics.find((m: any) => m.key === "monthlyRevenue")?.value || 0, isCurrency: true },
              { label: "Every Other Week", value: metrics.find((m: any) => m.key === "everyOtherWeekRevenue")?.value || 0, isCurrency: true },
              { label: "Weekly", value: metrics.find((m: any) => m.key === "weeklyRevenue")?.value || 0, isCurrency: true },
            ]}
          />
        </div>

        <div className="premium-card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 leading-none">Booking Frequency</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Job Count by Service Type</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <RevenueTable
            rows={[
              { label: "Total Bookings", value: metrics.find((m: any) => m.key === "countTotal")?.value || 0, isCurrency: false },
              { label: "Recurring Agreements", value: metrics.find((m: any) => m.key === "countRecurring")?.value || 0, isCurrency: false },
              { label: "Monthly Cleanings", value: metrics.find((m: any) => m.key === "countMonthly")?.value || 0, isCurrency: false },
              { label: "Weekly Cleanings", value: metrics.find((m: any) => m.key === "countWeekly")?.value || 0, isCurrency: false },
              { label: "Bi-Weekly Cleanings", value: metrics.find((m: any) => m.key === "countBiweekly")?.value || 0, isCurrency: false },
              { label: "One-Time Jobs", value: metrics.find((m: any) => m.key === "countOneTime")?.value || 0, isCurrency: false },
            ]}
          />
        </div>
      </div>
    </AdminShell>
  );
}

function RevenueTable({ rows }: { rows: { label: string; value: number; isCurrency?: boolean }[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/30">
      <table className="min-w-full text-sm">
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.label}
              className={`group hover:bg-white transition-colors ${idx !== rows.length - 1 ? 'border-b border-slate-100' : ''} ${idx === 0 ? 'bg-white/50' : ''}`}
            >
              <td className="px-6 py-4 text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{row.label}</td>
              <td className="px-6 py-4 text-right">
                <span className={`text-lg font-black tracking-tight ${row.isCurrency ? 'text-brand-800' : 'text-slate-900'}`}>
                  {row.isCurrency && <span className="text-xs font-bold mr-1 opacity-50">$</span>}
                  {row.value.toLocaleString(undefined, { minimumFractionDigits: row.isCurrency ? 2 : 0 })}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { DollarSign, CalendarDays } from "lucide-react";
