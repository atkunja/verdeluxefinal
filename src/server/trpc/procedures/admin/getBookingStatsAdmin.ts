import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";
import { normalizeDetroitRange } from "~/utils/dateRange";

export const getBookingStatsAdmin = requireAdmin.query(async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthRange = normalizeDetroitRange(startOfMonth, endOfMonth);

  const totalBookings = await db.booking.count();
  const completedBookings = await db.booking.count({
    where: { status: "COMPLETED" },
  });
  const cancelledBookings = await db.booking.count({
    where: { status: "CANCELLED" },
  });

  const monthBookings = await db.booking.count({
    where: {
      scheduledDate: { gte: monthRange.start ?? startOfMonth, lte: monthRange.end ?? endOfMonth },
      status: { not: "CANCELLED" },
    },
  });

  const revenueTotalAgg = await db.booking.aggregate({
    _sum: { finalPrice: true },
    where: { status: { not: "CANCELLED" } },
  });
  const revenuePendingAgg = await db.booking.aggregate({
    _sum: { finalPrice: true },
    where: { status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } },
  });
  const revenue = {
    total: revenueTotalAgg._sum.finalPrice ?? 0,
    pending: revenuePendingAgg._sum.finalPrice ?? 0,
  };

  // Previous Month Stats
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const prevMonthRange = normalizeDetroitRange(startOfPrevMonth, endOfPrevMonth);

  const previousMonthBookings = await db.booking.count({
    where: {
      scheduledDate: { gte: prevMonthRange.start ?? startOfPrevMonth, lte: prevMonthRange.end ?? endOfPrevMonth },
      status: { not: "CANCELLED" },
    },
  });

  const previousMonthRevenueAgg = await db.booking.aggregate({
    _sum: { finalPrice: true },
    where: {
      scheduledDate: { gte: prevMonthRange.start ?? startOfPrevMonth, lte: prevMonthRange.end ?? endOfPrevMonth },
      status: { not: "CANCELLED" },
    },
  });
  const previousMonthRevenue = previousMonthRevenueAgg._sum.finalPrice ?? 0;

  // Current Month Revenue (for explicit "Monthly Revenue" card)
  const currentMonthRevenueAgg = await db.booking.aggregate({
    _sum: { finalPrice: true },
    where: {
      scheduledDate: { gte: monthRange.start ?? startOfMonth, lte: monthRange.end ?? endOfMonth },
      status: { not: "CANCELLED" },
    },
  });
  const currentMonthRevenue = currentMonthRevenueAgg._sum.finalPrice ?? 0;

  // Last 6 months revenue trend (net from bookings)
  const revenueTrends: { month: string; monthKey: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const normalized = normalizeDetroitRange(start, end);
    const agg = await db.booking.aggregate({
      _sum: { finalPrice: true },
      where: {
        scheduledDate: { gte: normalized.start ?? start, lte: normalized.end ?? end },
        status: { not: "CANCELLED" },
      },
    });
    const label = start.toLocaleDateString("en-US", { month: "short" });
    revenueTrends.push({
      month: label,
      monthKey: `${start.getFullYear()}-${start.getMonth() + 1}`,
      revenue: agg._sum.finalPrice ?? 0,
    });
  }

  const upcomingAppointmentsRaw = await db.booking.findMany({
    where: { scheduledDate: { gte: now }, status: { not: "CANCELLED" } },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      cleaner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, color: true } },
      payments: { select: { amount: true, paidAt: true } },
    },
    orderBy: { scheduledDate: "asc" },
    take: 10,
  });

  const upcomingAppointments = upcomingAppointmentsRaw.map((booking) => {
    const totalPaid = booking.payments.reduce((sum, p) => (p.paidAt ? sum + p.amount : sum), 0);
    const isPaid = (booking.finalPrice || 0) > 0 && totalPaid >= (booking.finalPrice || 0);
    const isPartial = totalPaid > 0 && totalPaid < (booking.finalPrice || 0);

    return {
      ...booking,
      paymentStatus: isPaid ? "Paid" : isPartial ? "Partial" : "Unpaid",
    };
  });

  const unassignedBookings = await db.booking.count({
    where: { status: { not: "CANCELLED" }, cleanerId: null },
  });

  const activeCleaners = await db.user.count({
    where: { role: "CLEANER", hasResetPassword: true },
  });
  const totalCleaners = await db.user.count({ where: { role: "CLEANER" } });

  return {
    totalBookings,
    completedBookings,
    cancelledBookings,
    monthBookings,
    revenue,
    revenueTrends,
    upcomingAppointments,
    unassignedBookings,
    activeCleaners,
    totalCleaners,
    previousMonthBookings,
    previousMonthRevenue,
    currentMonthRevenue,
  };
});
