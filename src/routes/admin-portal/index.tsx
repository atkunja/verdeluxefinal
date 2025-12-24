import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { AdminShell } from "~/components/admin/AdminShell";
import { dashboardOverviewMock } from "~/mocks/adminPortal";
import { chargeBooking } from "~/api/adminPortal";
import { useAuthStore } from "~/stores/authStore";
import { CalendarDays, CreditCard, TrendingDown, TrendingUp, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/admin-portal/")({
  component: AdminDashboardPage,
});

function StatCard({
  label,
  value,
  previous,
  changePct,
  icon: Icon,
  colorClass = "text-primary",
}: {
  label: string;
  value: number;
  previous: number;
  changePct: number;
  icon: any;
  colorClass?: string;
}) {
  const positive = changePct >= 0;
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 opacity-50 transition-transform group-hover:scale-110" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-3xl font-bold text-[#0f172a]">${value.toLocaleString()}</div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
            >
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(changePct)}%
            </div>
            <span className="text-xs text-gray-400">vs last month</span>
          </div>
        </div>
        <div className={`rounded-2xl bg-white p-3 shadow-sm border border-gray-100 ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function Sparkline({ points, labels }: { points: number[]; labels: string[] }) {
  if (points.length < 2) return <div className="h-24 flex items-center justify-center text-gray-400 text-sm italic">Insufficient data for trend</div>;

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const height = 80;
  const width = 400;
  const step = width / (points.length - 1);

  const normalized = points.map((p) => ((p - min) / range) * (height - 20) + 10);
  const pathData = normalized.map((y, idx) => `${idx === 0 ? "M" : "L"} ${idx * step} ${height - y}`).join(" ");

  // Create a smoother curve using quadratic bezier if desired, but polyline is fine for now if styled well
  // Let's add an area fill
  const areaData = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#163022" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#163022" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaData} fill="url(#gradient)" />
        <path d={pathData} fill="none" stroke="#163022" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {normalized.map((y, idx) => (
          <g key={idx} className="group/dot">
            <circle
              cx={idx * step}
              cy={height - y}
              r="4"
              fill="#163022"
              className="transition-all group-hover/dot:r-6"
            />
          </g>
        ))}
      </svg>
      <div className="mt-4 flex justify-between px-1 text-[10px] font-medium uppercase tracking-widest text-gray-400">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function AdminDashboardPage() {
  const { user } = useAuthStore();
  const trpc = useTRPC();
  const firstName = user?.firstName || "Admin";

  const statsQuery = useQuery(trpc.getBookingStatsAdmin.queryOptions());
  const tasksQuery = useQuery(trpc.getAdminTasks.queryOptions());
  const pendingChargesQuery = useQuery(trpc.payments.getPendingCharges.queryOptions());

  const chargeMutation = useMutation(trpc.stripe.createChargeWithSavedMethod.mutationOptions({
    onSuccess: () => {
      pendingChargesQuery.refetch();
      tasksQuery.refetch();
    }
  }));

  const todaysDate = useMemo(() => new Date(), []);

  const handleCharge = async (bookingId: string, customerId: number, customerName: string, amount: number) => {
    const ok = window.confirm(`Charge $${amount.toFixed(2)} to ${customerName}'s card?`);
    if (!ok) return;

    try {
      await chargeMutation.mutateAsync({
        userId: customerId,
        bookingId: parseInt(bookingId),
        amount,
      });
      alert("Charge successful!");
    } catch (err: any) {
      alert(`Charge failed: ${err.message}`);
    }
  };

  const revenueChangePct = useMemo(() => {
    if (!statsQuery.data) return 0;
    const { currentMonthRevenue, previousMonthRevenue } = statsQuery.data;
    if (previousMonthRevenue === 0) return currentMonthRevenue > 0 ? 100 : 0;
    return Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100);
  }, [statsQuery.data]);

  const bookingsChangePct = useMemo(() => {
    if (!statsQuery.data) return 0;
    const { monthBookings, previousMonthBookings } = statsQuery.data;
    if (previousMonthBookings === 0) return monthBookings > 0 ? 100 : 0;
    return Math.round(((monthBookings - previousMonthBookings) / previousMonthBookings) * 100);
  }, [statsQuery.data]);

  return (
    <AdminShell
      title={`Hello, ${firstName}!`}
      subtitle="Here is what's happening with Verde Luxe today."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <StatCard
          label="Monthly Revenue"
          value={statsQuery.data?.currentMonthRevenue ?? 0}
          previous={statsQuery.data?.previousMonthRevenue ?? 0}
          changePct={revenueChangePct}
          icon={CreditCard}
          colorClass="text-emerald-600"
        />
        <StatCard
          label="Monthly Bookings"
          value={statsQuery.data?.monthBookings ?? 0}
          previous={statsQuery.data?.previousMonthBookings ?? 0}
          changePct={bookingsChangePct}
          icon={CalendarDays}
          colorClass="text-indigo-600"
        />
        <div className="rounded-3xl border border-white/40 bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">My Calendar</div>
              <div className="text-xl font-bold text-[#0f172a]">
                {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(todaysDate)}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-2.5 shadow-sm border border-gray-100 text-[#163022]">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
            {Array.from({ length: 7 }).map((_, idx) => {
              const day = new Date(todaysDate);
              day.setDate(todaysDate.getDate() + idx);
              const isToday = idx === 0;
              return (
                <div
                  key={idx}
                  className={`rounded-xl py-2 transition-colors ${isToday ? "bg-[#163022] text-white shadow-md" : "bg-gray-50/50 text-gray-600 hover:bg-gray-100/50"}`}
                >
                  <div className={`text-[10px] font-bold uppercase ${isToday ? "text-white/80" : "text-gray-400"}`}>
                    {new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day)[0]}
                  </div>
                  <div className="text-sm font-bold">{day.getDate()}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/40 bg-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#0f172a]">Revenue Trends</h3>
              <p className="text-sm text-gray-500">Performance over the last 6 months</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100">
              <TrendingUp className="h-5 w-5 text-[#163022]" />
            </div>
          </div>
          <Sparkline
            points={statsQuery.data?.revenueTrends.map((t) => t.revenue) ?? []}
            labels={statsQuery.data?.revenueTrends.map((t) => t.month) ?? []}
          />
        </div>

        <div className="rounded-3xl border border-white/40 bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-[#0f172a]">Pending Charges</h3>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-100">
              {pendingChargesQuery.data?.length ?? 0}
            </span>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {pendingChargesQuery.data?.map((charge) => (
              <div key={charge.id} className="group rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-gray-200 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-[#0f172a]">{charge.customer.name}</div>
                    <div className="mt-0.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                      {charge.serviceDate} • {charge.serviceTime}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-base font-bold text-[#163022]">${charge.amount.toFixed(2)}</div>
                    <button
                      onClick={() => handleCharge(charge.id, charge.customer.id, charge.customer.name, charge.amount)}
                      disabled={chargeMutation.isPending}
                      className="mt-2 inline-flex items-center rounded-xl bg-[#163022] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-[#10271b] hover:shadow-md disabled:opacity-50"
                    >
                      {chargeMutation.isPending ? "..." : "Charge"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {pendingChargesQuery.isLoading && <div className="py-8 text-center text-sm text-gray-400 italic">Finding charges...</div>}
            {pendingChargesQuery.data?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 rounded-2xl bg-gray-50 p-4">
                  <CheckCircle className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400 italic">All jobs are squared away!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/40 bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md lg:col-span-1 min-h-[460px]">
          <div className="mb-6 flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-[#0f172a]">Action Center</h3>
            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-100">
              {tasksQuery.data?.length ?? 0}
            </span>
          </div>
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
            {tasksQuery.data?.map((task) => {
              const parts = task.color.split(' ');
              const bgColor = parts[0] || 'bg-gray-100';
              const textColor = parts[1] || 'text-gray-700';
              return (
                <div key={task.id} className="flex items-start gap-4 rounded-2xl border border-gray-50 bg-white/80 p-4 transition-all hover:shadow-sm">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm border border-white ${bgColor} ${textColor.replace('text-', 'text-opacity-80 text-')}`}>
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#0f172a]">{task.title}</div>
                    <div className="mt-1 text-xs leading-relaxed text-gray-500">{task.description}</div>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">{task.time}</div>
                  </div>
                </div>
              );
            })}
            {tasksQuery.isLoading && <div className="py-12 text-center text-sm text-gray-400 italic">Busy organizing...</div>}
            {tasksQuery.data?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 rounded-3xl bg-emerald-50 p-6">
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Inbox Zero!</h4>
                <p className="mt-1 text-xs text-gray-400">Everything is up to date.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/40 bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md lg:col-span-2">
          <div className="mb-6 flex items-center justify-between px-1">
            <div>
              <h3 className="text-lg font-bold text-[#0f172a]">Upcoming Jobs</h3>
              <p className="text-sm text-gray-500">Next 10 service appointments</p>
            </div>
            <Link to="/admin-portal/bookings" className="text-xs font-bold text-[#163022] hover:underline">View All</Link>
          </div>
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {statsQuery.data?.upcomingAppointments.map((job) => (
              <div key={job.id} className="group flex items-center justify-between rounded-2xl border border-gray-50 bg-white p-4 transition-all hover:border-gray-100 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-colors group-hover:bg-[#163022]/5 group-hover:text-[#163022]">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0f172a]">
                      {job.client.firstName} {job.client.lastName}
                    </div>
                    <div className="mt-0.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{job.serviceType}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <span>{new Date(job.scheduledDate).toLocaleDateString()}</span>
                      <span className="h-1 w-1 rounded-full bg-gray-300" />
                      <span>{job.scheduledTime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {job.cleaner && (
                    <div className="hidden items-center gap-2 sm:flex">
                      <span
                        className="inline-flex items-center gap-2 rounded-full border border-current border-opacity-10 px-3 py-1 text-[11px] font-bold"
                        style={{ backgroundColor: `${job.cleaner.color ?? "#000000"}08`, color: job.cleaner.color ?? "#000000" }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: job.cleaner.color ?? "#000000" }} />
                        {job.cleaner.firstName}
                      </span>
                    </div>
                  )}
                  <div className="min-w-[80px] text-right">
                    <div className="text-base font-bold text-[#0f172a]">${(job.finalPrice ?? 0).toFixed(0)}</div>
                    <div className={`mt-0.5 text-[10px] font-bold uppercase tracking-widest ${job.paymentStatus === "Paid" ? "text-emerald-600" : "text-amber-600"}`}>
                      {job.paymentStatus ?? "Unpaid"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {statsQuery.isLoading && <div className="py-12 text-center text-sm text-gray-400 italic">Syncing with calendar...</div>}
            {(!statsQuery.data?.upcomingAppointments || statsQuery.data.upcomingAppointments.length === 0) && (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm font-medium text-gray-400">No upcoming jobs found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
