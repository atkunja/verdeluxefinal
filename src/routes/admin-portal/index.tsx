import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { AdminShell } from "~/components/admin/AdminShell";
import { useAuthStore } from "~/stores/authStore";
import { CalendarDays, CreditCard, TrendingDown, TrendingUp, CheckCircle, UserPlus, Mail, AlertCircle, ArrowRight, DollarSign } from "lucide-react";

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
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-3xl font-bold text-[#0f172a]">${value.toLocaleString()}</div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${positive ? "text-emerald-700" : "text-rose-700"}`}
            >
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(changePct)}% vs last month
            </div>
          </div>
        </div>
        <div className={`rounded-2xl p-3 shadow-sm border border-gray-100 ${colorClass} bg-white`}>
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
        <path d={areaPath} fill="url(#chartGradient)" />
        <path
          d={linePath}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {normalized.map((y, idx) => (
          <g
            key={idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="cursor-pointer"
          >
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
      subtitle="Manage your cleaning business overview."
    >
      {/* Stats Row */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <StatCard
          label="Monthly Revenue"
          value={statsQuery.data?.currentMonthRevenue ?? 0}
          previous={statsQuery.data?.previousMonthRevenue ?? 0}
          changePct={revenueChangePct}
          icon={DollarSign}
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
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Revenue Overview */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Revenue Overview</h3>
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Last 6 months</span>
          </div>
          <StockChart
            points={statsQuery.data?.revenueTrends.map((t) => t.revenue) ?? []}
            labels={statsQuery.data?.revenueTrends.map((t) => t.month) ?? []}
          />
        </div>

        {/* Column 2: Pending Charges */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900">Pending Charges</h3>
              <p className="text-xs text-gray-500 mt-1">{pendingChargesQuery.data?.length ?? 0} jobs ready to charge</p>
            </div>
            <div className="bg-yellow-50 text-yellow-600 p-2 rounded-xl">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-4">
            {pendingChargesQuery.data?.map((charge) => (
              <div key={charge.id} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <UserPlus className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{charge.customer.name}</div>
                    <div className="text-xs text-gray-500">{charge.serviceType || 'Standard Cleaning'}</div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {charge.serviceDate}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-600 mb-2">${charge.amount.toFixed(2)}</div>
                  <button
                    onClick={() => handleCharge(charge.id, charge.customer.id, charge.customer.name, charge.amount)}
                    disabled={chargeMutation.isPending}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {chargeMutation.isPending ? "..." : "$ Charge"}
                  </button>
                </div>
              </div>
            ))}
            {(!pendingChargesQuery.data || pendingChargesQuery.data.length === 0) && (
              <div className="text-center py-8 text-gray-400 text-sm italic">
                No pending charges
              </div>
            )}
            {(pendingChargesQuery.data?.length ?? 0) > 5 && (
              <div className="text-center pt-2">
                <span className="text-xs text-gray-400 font-medium">+{(pendingChargesQuery.data?.length ?? 0) - 5} more pending charges</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Calendar */}
        <div className="space-y-6">
          {/* Calendar Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900">My Calendar</h3>
                <p className="text-xs text-gray-500 mt-1">Personal tasks & reminders</p>
              </div>
              <div className="bg-purple-50 text-purple-600 p-2 rounded-xl">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>

            {/* Big Date Card */}
            <div className="bg-[#163022] rounded-xl p-4 text-white mb-6">
              <div className="text-xs opacity-80 uppercase tracking-wider">{new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(selectedDate)}</div>
              <div className="text-4xl font-bold mt-1">{selectedDate.getDate()}</div>
              <div className="text-xs opacity-80 mt-1">{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(selectedDate)}</div>
            </div>

            {/* Week Row */}
            <div className="grid grid-cols-7 gap-1 text-center mb-6">
              {Array.from({ length: 7 }).map((_, idx) => {
                const day = new Date(todaysDate);
                day.setDate(todaysDate.getDate() + idx);
                const isSelected = selectedDate.toDateString() === day.toDateString();

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(new Date(day))}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${isSelected ? 'bg-[#163022] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className="text-[10px] font-bold uppercase">{new Intl.DateTimeFormat("en-US", { weekday: "narrow" }).format(day)}</span>
                    <span className={`text-sm font-bold mt-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>{day.getDate()}</span>
                  </button>
                )
              })}
            </div>

            {/* Today's Tasks */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today's Tasks</span>
              </div>
              <div className="space-y-2">
                {/* Integrate Action Center tasks here effectively */}
                {tasksQuery.data?.slice(0, 3).map(task => {
                  const parts = task.color.split(' ');
                  const bgColor = parts[0] || 'bg-gray-100';
                  const textColor = parts[1] || 'text-gray-700';

                  return (
                    <div key={task.id} className={`p-3 rounded-xl border border-gray-100 ${bgColor} bg-opacity-30`}>
                      <div className="flex justify-between items-start">
                        <div className="text-xs font-bold text-gray-900 line-clamp-1">{task.title}</div>
                        <div className="text-[10px] text-gray-500">{task.time}</div>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 line-clamp-1">{task.description}</div>
                    </div>
                  )
                })}
                {(!tasksQuery.data || tasksQuery.data.length === 0) && (
                  <div className="text-xs text-gray-400 italic">No tasks for today</div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Jobs Widget - Moved to match layout better vertically */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Upcoming Jobs</h3>
              <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>

            {statsQuery.data?.upcomingAppointments.slice(0, 2).map((job) => (
              <div key={job.id} className="mb-4 last:mb-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">{job.client.firstName} {job.client.lastName}</div>
                    <div className="text-[10px] text-gray-500">{job.serviceType}</div>
                  </div>
                </div>
                <div className="pl-11 text-[10px] text-gray-400">
                  {new Date(job.scheduledDate).toLocaleDateString()} • {job.scheduledTime}
                </div>
              </div>
            ))}
            {(!statsQuery.data?.upcomingAppointments || statsQuery.data.upcomingAppointments.length === 0) && (
              <div className="text-center py-4">
                <CalendarDays className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <div className="text-xs text-gray-400">No jobs scheduled</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminShell>
  );
}
