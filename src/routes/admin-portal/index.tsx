import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { AdminShell } from "~/components/admin/AdminShell";
import { dashboardOverviewMock } from "~/mocks/adminPortal";
import { chargeBooking } from "~/api/adminPortal";
import { useAuthStore } from "~/stores/authStore";
import { CalendarDays, CreditCard, TrendingDown, TrendingUp, CheckCircle, UserPlus, Mail, AlertCircle, ArrowRight } from "lucide-react";

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

function StockChart({ points, labels }: { points: number[]; labels: string[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (points.length < 2) {
    return <div className="h-32 flex items-center justify-center text-gray-400 text-sm italic">Insufficient data for trend</div>;
  }

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const height = 120;
  const width = 500;
  const paddingX = 10;
  const paddingY = 15;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const step = chartWidth / (points.length - 1);

  const normalized = points.map((p) => ((p - min) / range) * chartHeight);

  // Create smooth bezier curve path
  const createSmoothPath = () => {
    const pts = normalized.map((y, idx) => ({
      x: paddingX + idx * step,
      y: height - paddingY - y
    }));

    if (pts.length < 2) return "";

    let path = `M ${pts[0].x} ${pts[0].y}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i]!;
      const p2 = pts[i + 1]!;
      const p3 = pts[i + 2] ?? p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  const linePath = createSmoothPath();
  const areaPath = linePath + ` L ${paddingX + (points.length - 1) * step} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

  // Check if trend is positive
  const isPositive = points[points.length - 1] >= points[0];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1f2937" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#1f2937" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1f2937" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#1f2937" />
            <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 1, 2, 3].map(i => (
          <line
            key={i}
            x1={paddingX}
            y1={paddingY + (chartHeight / 3) * i}
            x2={width - paddingX}
            y2={paddingY + (chartHeight / 3) * i}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#chartGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive dots */}
        {normalized.map((y, idx) => (
          <g
            key={idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="cursor-pointer"
          >
            {/* Larger invisible hit area */}
            <circle
              cx={paddingX + idx * step}
              cy={height - paddingY - y}
              r="12"
              fill="transparent"
            />
            <circle
              cx={paddingX + idx * step}
              cy={height - paddingY - y}
              r={hoveredIdx === idx ? 6 : 4}
              fill={hoveredIdx === idx ? (isPositive ? "#10b981" : "#ef4444") : "#1f2937"}
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-200"
            />
          </g>
        ))}

        {/* Hover tooltip */}
        {hoveredIdx !== null && (
          <g>
            <rect
              x={paddingX + hoveredIdx * step - 40}
              y={height - paddingY - normalized[hoveredIdx] - 40}
              width="80"
              height="28"
              rx="6"
              fill="#1f2937"
              className="drop-shadow-lg"
            />
            <text
              x={paddingX + hoveredIdx * step}
              y={height - paddingY - normalized[hoveredIdx] - 21}
              textAnchor="middle"
              fill="white"
              fontSize="11"
              fontWeight="bold"
            >
              ${points[hoveredIdx].toLocaleString()}
            </text>
          </g>
        )}
      </svg>

      {/* Labels */}
      <div className="flex justify-between px-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">
        {labels.map((l, i) => (
          <span key={i} className={hoveredIdx === i ? "text-gray-700 font-bold" : ""}>{l}</span>
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
  const [selectedDate, setSelectedDate] = useState<Date>(todaysDate);
  const navigate = useNavigate();

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
              const isSelected = selectedDate.toDateString() === day.toDateString();
              const dayBookings = statsQuery.data?.upcomingAppointments.filter(job => {
                const jobDate = new Date(job.scheduledDate);
                return jobDate.toDateString() === day.toDateString();
              }) || [];
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(new Date(day))}
                  className={`rounded-xl py-2 transition-all cursor-pointer relative ${isSelected
                    ? "bg-[#163022] text-white shadow-md ring-2 ring-[#163022]/30"
                    : isToday
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-50/50 text-gray-600 hover:bg-gray-100/50"
                    }`}
                >
                  <div className={`text-[10px] font-bold uppercase ${isSelected ? "text-white/80" : isToday ? "text-emerald-600" : "text-gray-400"}`}>
                    {new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day)[0]}
                  </div>
                  <div className="text-sm font-bold">{day.getDate()}</div>
                  {dayBookings.length > 0 && (
                    <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full text-[9px] font-bold flex items-center justify-center ${isSelected ? "bg-white text-[#163022]" : "bg-[#163022] text-white"}`}>
                      {dayBookings.length}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Bookings */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs font-bold uppercase text-gray-500 mb-2">
              {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" }).format(selectedDate)}
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {statsQuery.data?.upcomingAppointments
                .filter(job => new Date(job.scheduledDate).toDateString() === selectedDate.toDateString())
                .map(job => (
                  <button
                    key={job.id}
                    onClick={() => navigate({ to: "/admin-portal/bookings" })}
                    className="w-full text-left rounded-lg bg-gray-50 p-2 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">{job.scheduledTime}</span>
                      <span className="text-xs font-bold text-[#163022]">${(job.finalPrice ?? 0).toFixed(0)}</span>
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {job.client.firstName} {job.client.lastName}
                    </div>
                  </button>
                )) ?? []}
              {(statsQuery.data?.upcomingAppointments.filter(job =>
                new Date(job.scheduledDate).toDateString() === selectedDate.toDateString()
              ).length ?? 0) === 0 && (
                  <div className="text-xs text-gray-400 italic py-2 text-center">No bookings</div>
                )}
            </div>
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
          <StockChart
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
              const borderColor = parts[2] || 'border-gray-200';

              // Get appropriate icon based on task type
              const getIcon = () => {
                if (task.id.startsWith('unassigned')) return <UserPlus className="h-5 w-5" />;
                if (task.id.startsWith('lead')) return <Mail className="h-5 w-5" />;
                if (task.id.startsWith('charge')) return <CreditCard className="h-5 w-5" />;
                return <AlertCircle className="h-5 w-5" />;
              };

              return (
                <button
                  key={task.id}
                  onClick={() => navigate({ to: (task as any).actionUrl || "/admin-portal/bookings" })}
                  className={`w-full flex items-start gap-4 rounded-2xl border ${borderColor} bg-white p-4 transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer text-left group`}
                >
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bgColor} ${textColor}`}>
                    {getIcon()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-[#0f172a]">{task.title}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bgColor} ${textColor}`}>
                        {task.time}
                      </span>
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-gray-500">{task.description}</div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#163022] opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Take Action</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </button>
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
