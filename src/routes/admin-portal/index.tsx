import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { CalendarDays, CreditCard, TrendingDown, TrendingUp, CheckCircle, UserPlus, Mail, AlertCircle, ArrowRight, DollarSign, CalendarRange } from "lucide-react";
import { AdminShell } from "~/components/admin/AdminShell";
import { useAuthStore } from "~/stores/authStore";

export const Route = createFileRoute("/admin-portal/")({
  component: AdminDashboardPage,
});

function StatCard({
  label,
  value,
  previous,
  changePct,
  icon: Icon,
  colorClass = "text-brand-800",
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
    <div className="premium-card group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              ${value.toLocaleString()}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
            >
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(changePct)}%
            </div>
            <span className="text-[10px] font-semibold text-slate-400">vs last month</span>
          </div>
        </div>
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-brand-800 group-hover:text-white transition-all duration-300 shadow-sm`}>
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

function StockChart({ points, labels, height = 120 }: { points: number[]; labels: string[]; height?: number }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (points.length < 2) {
    return <div className={`h-[${height}px] flex items-center justify-center text-slate-400 text-sm italic`}>Insufficient data for trend</div>;
  }

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const width = 800;
  const paddingX = 40;
  const paddingY = 30;
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

    let path = `M ${pts[0]?.x ?? 0} ${pts[0]?.y ?? 0}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i]!;
      const p2 = pts[i + 1]!;
      const cp1x = p1.x + (p2.x - p1.x) / 2;
      const cp1y = p1.y;
      const cp2x = p1.x + (p2.x - p1.x) / 2;
      const cp2y = p2.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  const linePath = createSmoothPath();
  const areaPath = linePath + ` L ${paddingX + (points.length - 1) * step} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

  const isPositive = (points[points.length - 1] ?? 0) >= (points[0] ?? 0);

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" style={{ maxHeight: height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#163022" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#163022" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal background lines */}
        {[0, 1, 2].map(i => (
          <line
            key={i}
            x1={paddingX}
            y1={paddingY + (chartHeight / 2) * i}
            x2={width - paddingX}
            y2={paddingY + (chartHeight / 2) * i}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill="url(#chartGradient)" />
        <path
          d={linePath}
          fill="none"
          stroke="#163022"
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
              r="20"
              fill="transparent"
            />
            {hoveredIdx === idx && (
              <circle
                cx={paddingX + idx * step}
                cy={height - paddingY - y}
                r="6"
                fill="#163022"
                stroke="white"
                strokeWidth="2"
                className="animate-in fade-in zoom-in duration-200"
              />
            )}
          </g>
        ))}

        {hoveredIdx !== null && points[hoveredIdx] !== undefined && (
          <g className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <rect
              x={paddingX + hoveredIdx * step - 50}
              y={height - paddingY - (normalized[hoveredIdx] ?? 0) - 45}
              width="100"
              height="32"
              rx="12"
              fill="#0f172a"
              className="shadow-xl"
            />
            <text
              x={paddingX + hoveredIdx * step}
              y={height - paddingY - (normalized[hoveredIdx] ?? 0) - 25}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="800"
              fontFamily="Outfit"
            >
              ${points[hoveredIdx]?.toLocaleString()}
            </text>
          </g>
        )}
      </svg>
      <div className="flex justify-between px-10 text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-6 border-t border-slate-50 pt-4">
        {labels.map((l, i) => (
          <span key={i} className={hoveredIdx === i ? "text-brand-800 font-extrabold" : ""}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function AdminDashboardPage() {
  const { user } = useAuthStore();
  const trpc = useTRPC();
  const firstName = user?.firstName || "Admin";

  const statsQuery = useQuery(trpc.getBookingStatsAdmin.queryOptions(undefined, { staleTime: 60000 })); // 1 min cache
  const tasksQuery = useQuery(trpc.getAdminTasks.queryOptions(undefined, { staleTime: 60000 }));
  const pendingChargesQuery = useQuery(trpc.payments.getPendingCharges.queryOptions(undefined, { staleTime: 30000 })); // 30s cache

  const chargeMutation = useMutation(trpc.stripe.createChargeWithSavedMethod.mutationOptions({
    onSuccess: () => {
      pendingChargesQuery.refetch();
      tasksQuery.refetch();
    }
  }));

  const todaysDate = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(todaysDate);

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
      subtitle="Welcome back to your business command center."
    >
      <div className="space-y-8">
        {/* Stats Row */}
        <div className="grid gap-6 md:grid-cols-2">
          <StatCard
            label="Monthly Revenue"
            value={statsQuery.data?.currentMonthRevenue ?? 0}
            previous={statsQuery.data?.previousMonthRevenue ?? 0}
            changePct={revenueChangePct}
            icon={DollarSign}
          />
          <StatCard
            label="Total Bookings"
            value={statsQuery.data?.monthBookings ?? 0}
            previous={statsQuery.data?.previousMonthBookings ?? 0}
            changePct={bookingsChangePct}
            icon={CalendarDays}
          />
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Evolution */}
            <div className="premium-card !p-0 overflow-hidden">
              <div className="p-8 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-none">Financial Performance</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Revenue trend • Last 6 months</p>
                </div>
                <div className="h-10 px-4 rounded-xl bg-brand-50 text-brand-800 flex items-center gap-2 text-xs font-bold ring-1 ring-brand-100">
                  <TrendingUp className="h-4 w-4" />
                  <span>+{revenueChangePct}% Growth</span>
                </div>
              </div>
              <div className="p-8 pt-6">
                <StockChart
                  points={statsQuery.data?.revenueTrends.map((t) => t.revenue) ?? []}
                  labels={statsQuery.data?.revenueTrends.map((t) => t.month) ?? []}
                  height={320}
                />
              </div>
            </div>

            {/* Pending Actions */}
            <div className="premium-card">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-none">Pending Actions</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Immediate attention required</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-1">
                {pendingChargesQuery.data?.map((charge) => (
                  <div key={charge.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                        {charge.customer.name[0]}
                      </div>
                      <div>
                        <p className="text font-bold text-slate-900">{charge.customer.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-slate-400 uppercase">{charge.serviceType || 'Standard Cleaning'}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <span className="text-xs font-medium text-slate-500">{charge.serviceDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-lg font-black text-brand-800">${charge.amount.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Post-service charge</p>
                      </div>
                      <button
                        onClick={() => handleCharge(charge.id, charge.customer.id, charge.customer.name, charge.amount)}
                        disabled={chargeMutation.isPending}
                        className="h-10 px-6 rounded-xl bg-brand-800 text-white text-xs font-bold shadow-lg shadow-brand-800/20 hover:bg-brand-700 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                      >
                        Process
                      </button>
                    </div>
                  </div>
                ))}
                {(!pendingChargesQuery.data || pendingChargesQuery.data.length === 0) && (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <CheckCircle className="h-10 w-10 text-slate-200" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">All caught up!</h4>
                    <p className="text-slate-400 font-medium mt-1">No pending charges at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-8">
            {/* Visual Calendar */}
            <div className="premium-card bg-[#163022] !border-brand-700 text-white shadow-brand-800/10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-lg font-extrabold text-white leading-none">Schedule</h3>
                  <p className="text-[10px] font-bold text-brand-300 uppercase tracking-widest mt-2">{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(selectedDate)}</p>
                </div>
                <CalendarDays className="h-5 w-5 text-brand-400 opacity-50" />
              </div>

              <div className="flex-1">
                <div className="flex flex-col items-center mb-10">
                  <span className="text-sm font-bold text-brand-300 uppercase tracking-[0.3em]">{new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(selectedDate)}</span>
                  <span className="text-[8rem] font-black leading-none tracking-tight">{selectedDate.getDate()}</span>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-10">
                  {Array.from({ length: 7 }).map((_, idx) => {
                    const day = new Date(todaysDate);
                    day.setDate(todaysDate.getDate() + idx);
                    const isSelected = selectedDate.toDateString() === day.toDateString();

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(new Date(day))}
                        className={`flex flex-col items-center justify-center py-4 rounded-2xl transition-all ${isSelected ? 'bg-white text-brand-800 shadow-xl scale-110' : 'text-brand-300 hover:bg-white/5 hover:text-white'}`}
                      >
                        <span className="text-[9px] font-black uppercase tracking-widest">{new Intl.DateTimeFormat("en-US", { weekday: "narrow" }).format(day)}</span>
                        <span className={`text-sm font-black mt-1`}>{day.getDate()}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-400">Scheduled Overview</p>
                <div className="space-y-3">
                  {tasksQuery.data?.slice(0, 3).map(task => (
                    <div key={task.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-black text-white group-hover:text-brand-200 transition-colors">{task.title}</p>
                        <span className="text-[9px] font-bold text-brand-400">{task.time}</span>
                      </div>
                      <p className="text-[11px] font-medium text-brand-300 leading-relaxed line-clamp-2">{task.description}</p>
                    </div>
                  ))}
                  {(!tasksQuery.data || tasksQuery.data.length === 0) && (
                    <p className="text-xs text-brand-500 italic text-center py-4">No events scheduled.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Footer Jobs */}
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 leading-none">Upcoming Confirmations</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Next 24-48 hours</p>
            </div>
            <Link
              to="/admin-portal/bookings"
              search={{ createFromLeadId: undefined } as any}
              className="h-10 px-5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              Management Hub <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statsQuery.data?.upcomingAppointments.slice(0, 4).map((job) => (
              <div key={job.id} className="flex p-5 rounded-2xl bg-slate-50 border border-slate-100 items-start gap-4 hover:shadow-md transition-all group">
                <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:bg-brand-800 group-hover:text-white transition-all">
                  <CalendarRange className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{job.client.firstName} {job.client.lastName}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">{new Date(job.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <div className="mt-3 inline-flex px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Confirmed</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
