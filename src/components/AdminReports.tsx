import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader, XCircle, TrendingUp } from "lucide-react";
import { useTRPC } from "~/trpc/react";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const formatCurrency = (amount?: number) => {
  const safeAmount = amount ?? 0;
  return currencyFormatter.format(safeAmount);
};

// Utility function to get the current week's start (Sunday) and end (Saturday) dates
const getCurrentWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

  // Calculate start of the week (Sunday)
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dayOfWeek);

  // Calculate end of the week (Saturday)
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - dayOfWeek));

  // Format dates as YYYY-MM-DD strings
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
};

const parseLocalDate = (dateString: string): Date => {
  return new Date(`${dateString}T00:00:00`);
};

export function AdminReports() {
  const trpc = useTRPC();
  // Get current week dates for default values
  const { start: defaultStart, end: defaultEnd } = getCurrentWeekDates();

  // State for date range inputs
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  // State for applied filters (what's actually sent to the API)
  const [appliedStartDate, setAppliedStartDate] = useState<string | undefined>(defaultStart);
  const [appliedEndDate, setAppliedEndDate] = useState<string | undefined>(defaultEnd);

  // Fetch revenue report data
  const revenueQuery = useQuery(
    trpc.getRevenueReport.queryOptions({
      startDate: appliedStartDate,
      endDate: appliedEndDate,
    })
  );
  const revenue = revenueQuery.data ?? {
    totalRevenue: 0,
    billedRevenue: 0,
    pendingRevenue: 0,
    recurringRevenue: 0,
    monthlyRevenue: 0,
    biweeklyRevenue: 0,
    weeklyRevenue: 0,
    oneTimeRevenue: 0,
    recentTransactions: [],
    revenueTrend: [],
  };

  const summaryText =
    appliedStartDate && appliedEndDate
      ? `Report for date: ${parseLocalDate(appliedStartDate).toLocaleDateString()} to ${parseLocalDate(appliedEndDate).toLocaleDateString()}`
      : "Report for current period";

  const handleApplyFilter = () => {
    setAppliedStartDate(startDate || undefined);
    setAppliedEndDate(endDate || undefined);
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    setAppliedStartDate(undefined);
    setAppliedEndDate(undefined);
  };

  const handleExportCsv = () => {
    if (!revenueQuery.data?.recentTransactions) {
      return;
    }
    const detroitFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Detroit",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const rows = revenueQuery.data.recentTransactions.map((tx: any) => ({
      date: tx.paidAt
        ? detroitFormatter.format(new Date(tx.paidAt))
        : "",
      amount: tx.amount,
      bookingId: tx.bookingId,
      serviceType: tx.serviceType,
      frequency: tx.serviceFrequency,
    }));
    const header = "date,amount,bookingId,serviceType,frequency";
    const csv = [header, ...rows.map((r: any) => `${r.date},${r.amount},${r.bookingId},${r.serviceType},${r.frequency}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "revenue-transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header + filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Reports</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-900">Revenue & Bookings Overview</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">{summaryText}</p>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleApplyFilter}
              className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              Apply
            </button>
            {(appliedStartDate || appliedEndDate) && (
              <button
                onClick={handleClearFilter}
                className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500">Applied filters: Custom</div>
      </div>

      {revenueQuery.isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-10 h-10 text-primary animate-spin" />
            <p className="text-gray-700 font-medium">Loading reports...</p>
          </div>
        </div>
      )}

      {revenueQuery.isError && (
        <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-10 h-10 text-red-600" />
            <p className="text-red-900 font-semibold">Error loading reports</p>
            <p className="text-red-700 text-sm">Please try again later.</p>
          </div>
        </div>
      )}

      {revenueQuery.isSuccess && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-md font-semibold text-gray-900">Popular reports</h3>
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
            {/* Revenue card */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Revenue</p>
                  <p className="text-xs text-gray-500">Total: {formatCurrency(revenue.totalRevenue)}</p>
                </div>
                <button className="text-xs font-semibold text-primary hover:underline">Go To Reports</button>
              </div>
              <div className="divide-y divide-gray-200">
                <Row label="Billed total revenue" value={formatCurrency(revenue.billedRevenue)} />
                <Row label="Pending payments" value={formatCurrency(revenue.pendingRevenue)} />
                <Row label="Recurring" value={formatCurrency(revenue.recurringRevenue)} />
                <Row label="Monthly" value={formatCurrency(revenue.monthlyRevenue)} />
                <Row label="Weekly" value={formatCurrency(revenue.weeklyRevenue)} />
                <Row label="Every other week" value={formatCurrency(revenue.biweeklyRevenue)} />
                <Row label="One time" value={formatCurrency(revenue.oneTimeRevenue)} />
              </div>
            </div>

            {/* Bookings card */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Bookings</p>
                  <p className="text-xs text-gray-500">
                    Total: {revenue.recentTransactions.length}
                  </p>
                </div>
                <button className="text-xs font-semibold text-primary hover:underline">Go To Reports</button>
              </div>
              <div className="divide-y divide-gray-200">
                <Row label="Recurring" value={revenue.biweeklyRevenue > 0 ? "Yes" : "0"} />
                <Row label="Monthly" value={revenue.monthlyRevenue > 0 ? "Yes" : "0"} />
                <Row label="Weekly" value={revenue.weeklyRevenue > 0 ? "Yes" : "0"} />
                <Row label="Every other week" value={revenue.biweeklyRevenue > 0 ? "Yes" : "0"} />
                <Row label="One time" value={revenue.oneTimeRevenue > 0 ? "Yes" : "0"} />
              </div>
            </div>

            {/* Payments / spend card */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Payments / Spend</p>
                  <p className="text-xs text-gray-500">
                    Total: {formatCurrency(revenue.billedRevenue + revenue.pendingRevenue)}
                  </p>
                </div>
                <button className="text-xs font-semibold text-primary hover:underline">Go To Reports</button>
              </div>
              <div className="divide-y divide-gray-200">
                <Row label="Captured" value={formatCurrency(revenue.billedRevenue)} />
                <Row label="Holds / pending" value={formatCurrency(revenue.pendingRevenue)} />
                <Row label="Recent transactions" value={`${revenue.recentTransactions.length}`} />
                <Row label="Export CSV" value="" actionLabel="Download" onAction={handleExportCsv} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  actionLabel,
  onAction,
}: {
  label: string;
  value: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-800">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        {actionLabel && onAction ? (
          <button
            className="text-xs font-semibold text-primary hover:underline"
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </button>
        ) : null}
        {value ? <span className="font-semibold text-gray-900">{value}</span> : null}
      </div>
    </div>
  );
}
