import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";
import { normalizeDetroitRange } from "~/utils/dateRange";

export const getBookingStatsAdmin = requireAdmin.query(async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthRange = normalizeDetroitRange(startOfMonth, endOfMonth);

  // Previous Month Stats setup
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const prevMonthRange = normalizeDetroitRange(startOfPrevMonth, endOfPrevMonth);

  // Consolidate every single query into one massive Promise.all for maximum parallelization
  const [
    totalBookings,
    completedBookings,
    cancelledBookings,
    monthBookings,
    revenueTotalAgg,
    revenuePendingAgg,
    previousMonthBookings,
    previousMonthRevenueAgg,
    currentMonthRevenueAgg,
    sixMonthsBookings,
    upcomingAppointmentsRaw,
    unassignedBookings,
    activeCleaners,
    totalCleaners
  ] = await Promise.all([
    db.booking.count(),
    db.booking.count({ where: { status: "COMPLETED" } }),
    db.booking.count({ where: { status: "CANCELLED" } }),
    db.booking.count({
      where: {
        scheduledDate: { gte: monthRange.start ?? startOfMonth, lte: monthRange.end ?? endOfMonth },
        status: { not: "CANCELLED" },
      },
    }),
    db.booking.aggregate({
      _sum: { finalPrice: true },
      where: { status: { not: "CANCELLED" } },
    }),
    db.booking.aggregate({
      _sum: { finalPrice: true },
      where: { status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } },
    }),
    db.booking.count({
      where: {
        scheduledDate: { gte: prevMonthRange.start ?? startOfPrevMonth, lte: prevMonthRange.end ?? endOfPrevMonth },
        status: { not: "CANCELLED" },
      },
    }),
    db.booking.aggregate({
      _sum: { finalPrice: true },
      where: {
        scheduledDate: { gte: prevMonthRange.start ?? startOfPrevMonth, lte: prevMonthRange.end ?? endOfPrevMonth },
        status: { not: "CANCELLED" },
      },
    }),
    db.booking.aggregate({
      _sum: { finalPrice: true },
      where: {
        scheduledDate: { gte: monthRange.start ?? startOfMonth, lte: monthRange.end ?? endOfMonth },
        status: { not: "CANCELLED" },
      },
    }),
    db.booking.findMany({
      where: {
        scheduledDate: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
        status: { not: "CANCELLED" },
      },
      select: { finalPrice: true, scheduledDate: true },
    }),
    db.booking.findMany({
      where: { scheduledDate: { gte: now }, status: { not: "CANCELLED" } },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        cleaner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, color: true } },
        payments: { select: { amount: true, paidAt: true } },
      },
      orderBy: { scheduledDate: "asc" },
      take: 10,
    }),
    db.booking.count({ where: { status: { not: "CANCELLED" }, cleanerId: null } }),
    db.user.count({ where: { role: "CLEANER", hasResetPassword: true } }),
    db.user.count({ where: { role: "CLEANER" } }),
  ]);

  const revenue = {
    total: revenueTotalAgg._sum.finalPrice ?? 0,
    pending: revenuePendingAgg._sum.finalPrice ?? 0,
  };
  const previousMonthRevenue = previousMonthRevenueAgg._sum.finalPrice ?? 0;
  const currentMonthRevenue = currentMonthRevenueAgg._sum.finalPrice ?? 0;

  const revenueTrends: { month: string; monthKey: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const label = d.toLocaleDateString("en-US", { month: "short" });

    // Filter bookings for this specific month
    const monthRevenue = sixMonthsBookings
      .filter(b => {
        const bDate = new Date(b.scheduledDate);
        return bDate.getFullYear() === d.getFullYear() && bDate.getMonth() === d.getMonth();
      })
      .reduce((sum, b) => sum + (b.finalPrice || 0), 0);

    revenueTrends.push({
      month: label,
      monthKey,
      revenue: monthRevenue,
    });
  }

  const upcomingAppointments = upcomingAppointmentsRaw.map((booking) => {
    const totalPaid = booking.payments.reduce((sum, p) => (p.paidAt ? sum + p.amount : sum), 0);
    const isPaid = (booking.finalPrice || 0) > 0 && totalPaid >= (booking.finalPrice || 0);
    const isPartial = totalPaid > 0 && totalPaid < (booking.finalPrice || 0);

    return {
      ...booking,
      paymentStatus: isPaid ? "Paid" : isPartial ? "Partial" : "Unpaid",
    };
  });

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
