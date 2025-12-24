import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";
import { normalizeDetroitRange } from "~/utils/dateRange";

export const getRevenueReport = requireAdmin
  .input(
    z.object({
      // Optional ISO date strings
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const toDetroitDate = (dateString: string, isEnd = false) => {
      const [year, month, day] = dateString.split("-").map(Number);
      const detroitFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Detroit",
        timeZoneName: "short",
      });
      // Use a UTC date and derive the Detroit offset from the formatted value (DST-safe)
      const utcAnchor = new Date(Date.UTC(year, month - 1, day, isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0, isEnd ? 999 : 0));
      const tzName = detroitFormatter
        .formatToParts(utcAnchor)
        .find((p) => p.type === "timeZoneName")
        ?.value;
      const offsetHours = tzName?.startsWith("GMT")
        ? Number(tzName.replace("GMT", ""))
        : 0;
      const offsetMs = offsetHours * 60 * 60 * 1000;
      return new Date(utcAnchor.getTime() - offsetMs);
    };

    const { start, end } = normalizeDetroitRange(input.startDate, input.endDate);

    const payments = await db.payment.findMany({
      include: {
        booking: {
          select: {
            id: true,
            serviceType: true,
            serviceFrequency: true,
            scheduledDate: true,
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });

    const isWithinRange = (date: Date | null | undefined) => {
      if (!date) return !(start || end);
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    };

    const filtered = payments.filter((payment) => {
      // If paid, use paidAt; otherwise fall back to the booking scheduled date for range filtering
      const referenceDate = payment.paidAt ?? payment.booking?.scheduledDate ?? payment.createdAt;
      return isWithinRange(referenceDate);
    });

    const sumBy = (items: typeof filtered, predicate: (p: (typeof filtered)[number]) => boolean) =>
      items.filter(predicate).reduce((sum, p) => sum + p.amount, 0);

    const billedRevenue = sumBy(filtered, (p) => Boolean(p.paidAt));
    const pendingRevenue = sumBy(filtered, (p) => !p.paidAt);

    const recurringRevenue = sumBy(
      filtered,
      (p) => p.booking?.serviceFrequency && p.booking.serviceFrequency !== "ONE_TIME" && Boolean(p.paidAt)
    );

    const monthlyRevenue = sumBy(
      filtered,
      (p) => p.booking?.serviceFrequency === "MONTHLY" && Boolean(p.paidAt)
    );
    const biweeklyRevenue = sumBy(
      filtered,
      (p) => p.booking?.serviceFrequency === "BIWEEKLY" && Boolean(p.paidAt)
    );
    const weeklyRevenue = sumBy(
      filtered,
      (p) => p.booking?.serviceFrequency === "WEEKLY" && Boolean(p.paidAt)
    );
    const oneTimeRevenue = sumBy(
      filtered,
      (p) => (p.booking?.serviceFrequency ?? "ONE_TIME") === "ONE_TIME" && Boolean(p.paidAt)
    );

    // Build a simple trend grouped by day of paidAt (or scheduled date if unpaid)
    const trendMap = new Map<string, number>();
    filtered.forEach((p) => {
      const refDate = p.paidAt ?? p.booking?.scheduledDate ?? p.createdAt;
      const detroitDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Detroit",
      }).format(refDate);
      const key = detroitDate;
      trendMap.set(key, (trendMap.get(key) ?? 0) + p.amount);
    });

    const revenueTrend = Array.from(trendMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const recentTransactions = filtered
      .slice(0, 10)
      .map((p) => ({
        amount: p.amount,
        paidAt: p.paidAt,
        bookingId: p.bookingId,
        serviceType: p.booking?.serviceType ?? "Unknown",
        serviceFrequency: p.booking?.serviceFrequency ?? "ONE_TIME",
      }));

    return {
      totalRevenue: billedRevenue + pendingRevenue,
      billedRevenue,
      pendingRevenue,
      recurringRevenue,
      monthlyRevenue,
      biweeklyRevenue,
      weeklyRevenue,
      oneTimeRevenue,
      recentTransactions,
      revenueTrend,
    };
  });
