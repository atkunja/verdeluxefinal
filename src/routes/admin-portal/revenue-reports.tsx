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
      subtitle="Snapshot of billed and recurring revenue."
      actions={
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={dateRange.start.toISOString().split('T')[0]}
            onChange={(e) => {
              const d = new Date(e.target.value);
              if (!isNaN(d.getTime())) setDateRange(prev => ({ ...prev, start: d }));
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2"
          />
          <input
            type="date"
            value={dateRange.end.toISOString().split('T')[0]}
            onChange={(e) => {
              const d = new Date(e.target.value);
              if (!isNaN(d.getTime())) setDateRange(prev => ({ ...prev, end: d }));
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2"
          />
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-lg font-semibold text-[#0f172a]">Revenue</div>
            <span className="text-xs text-gray-500">Popular reports</span>
          </div>
          <RevenueTable
            rows={[
              { label: "Billed total revenue", value: metrics.find((m: any) => m.key === "billedRevenue")?.value || 0, isCurrency: true },
              { label: "Pending payments", value: metrics.find((m: any) => m.key === "pendingPayments")?.value || 0, isCurrency: true },
              { label: "Recurring", value: metrics.find((m: any) => m.key === "recurringRevenue")?.value || 0, isCurrency: true },
              { label: "Monthly", value: metrics.find((m: any) => m.key === "monthlyRevenue")?.value || 0, isCurrency: true },
              { label: "Every other week", value: metrics.find((m: any) => m.key === "everyOtherWeekRevenue")?.value || 0, isCurrency: true },
              { label: "Weekly", value: metrics.find((m: any) => m.key === "weeklyRevenue")?.value || 0, isCurrency: true },
            ]}
          />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-lg font-semibold text-[#0f172a]">Bookings</div>
            <span className="text-xs text-gray-500">Popular reports</span>
          </div>
          <RevenueTable
            rows={[
              { label: "Total", value: metrics.find((m: any) => m.key === "countTotal")?.value || 0, isCurrency: false },
              { label: "Recurring", value: metrics.find((m: any) => m.key === "countRecurring")?.value || 0, isCurrency: false },
              { label: "Monthly", value: metrics.find((m: any) => m.key === "countMonthly")?.value || 0, isCurrency: false },
              { label: "Weekly", value: metrics.find((m: any) => m.key === "countWeekly")?.value || 0, isCurrency: false },
              { label: "Every other week", value: metrics.find((m: any) => m.key === "countBiweekly")?.value || 0, isCurrency: false },
              { label: "One time", value: metrics.find((m: any) => m.key === "countOneTime")?.value || 0, isCurrency: false },
            ]}
          />
        </div>
      </div>
    </AdminShell>
  );
}

function RevenueTable({ rows }: { rows: { label: string; value: number; isCurrency?: boolean }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="min-w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="even:bg-[#f9fafb]">
              <td className="px-3 py-2 text-gray-700">{row.label}</td>
              <td className="px-3 py-2 text-right font-semibold text-[#0f172a]">
                {row.isCurrency && "$"}
                {row.value.toLocaleString(undefined, { minimumFractionDigits: row.isCurrency ? 2 : 0 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
