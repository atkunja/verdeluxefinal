import { z } from "zod";
import { db } from "~/server/db";
import crypto from "crypto";
import { requireAdmin } from "~/server/trpc/main";
import { normalizeDetroitRange } from "~/utils/dateRange";

export const getAllBookingsAdmin = requireAdmin
  .input(
    z.object({
      // ISO date strings (e.g. "2025-09-01"); converted to Date on the server
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      clientId: z.number().optional(),
      cleanerId: z.number().optional(),
      status: z
        .enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
        .optional(),
      backfillRecurrence: z.boolean().optional(),
    })
  )
  .query(async ({ input }) => {
    const where: any = {};

    if (input.startDate || input.endDate) {
      const range = normalizeDetroitRange(input.startDate, input.endDate);
      where.scheduledDate = {
        ...(range.start ? { gte: range.start } : {}),
        ...(range.end ? { lte: range.end } : {}),
      };
    }

    if (input.clientId) {
      where.clientId = input.clientId;
    }

    if (input.cleanerId) {
      where.OR = [
        { cleanerId: input.cleanerId },
        { cleaners: { some: { cleanerId: input.cleanerId } } },
      ];
    }

    if (input.status) {
      where.status = input.status;
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            color: true,
          },
        },
        checklist: {
          include: {
            items: {
              select: {
                id: true,
                isCompleted: true,
                completedAt: true,
                completedBy: true,
              },
              orderBy: {
                order: "asc",
              },
            },
            template: {
              select: {
                name: true,
                serviceType: true,
              },
            },
          },
        },
        cleaners: {
          include: {
            cleaner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                color: true,
              },
            },
          },
        },
        stripePayments: {
          orderBy: { createdAt: "desc" },
          select: {
            stripeIntentId: true,
            paymentMethod: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        scheduledDate: "asc",
      },
    });

    // Backfill recurrenceId for legacy recurring bookings if requested
    if (input.backfillRecurrence) {
      for (const booking of bookings) {
        if (
          !booking.recurrenceId &&
          booking.serviceFrequency &&
          booking.serviceFrequency !== "ONE_TIME"
        ) {
          const recurrenceId = crypto.randomUUID();
          await db.booking.update({
            where: { id: booking.id },
            data: { recurrenceId, occurrenceNumber: 1 },
          });
        }
      }
    }

    const now = new Date();
    const detroit = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Detroit",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const toDetroitDateOnly = (d: Date) => {
      const parts = detroit.formatToParts(d).reduce(
        (acc, part) => {
          if (part.type === "year") acc.year = Number(part.value);
          if (part.type === "month") acc.month = Number(part.value);
          if (part.type === "day") acc.day = Number(part.value);
          return acc;
        },
        {} as { year?: number; month?: number; day?: number }
      );
      return new Date(parts.year ?? d.getFullYear(), (parts.month ?? 1) - 1, parts.day ?? d.getDate());
    };

    const bookingsWithDerivedStatus = bookings.map((booking) => {
      const scheduledDate = toDetroitDateOnly(new Date(booking.scheduledDate));
      if (scheduledDate < toDetroitDateOnly(now) && booking.status !== "CANCELLED") {
        return {
          ...booking,
          status: "COMPLETED" as const,
        };
      }
      const latestPayment = booking.stripePayments?.[0];
      return {
        ...booking,
        paymentIntentId: latestPayment?.stripeIntentId,
        paymentMethod: latestPayment?.paymentMethod ?? booking.paymentMethod,
      };
    });

    // Get unread message counts per client for calendar badge
    const clientIds = [...new Set(bookings.map(b => b.clientId))];
    const unreadCounts = await db.message.groupBy({
      by: ['senderId'],
      where: {
        senderId: { in: clientIds },
        isRead: false,
      },
      _count: { id: true },
    });
    const unreadMap = new Map(unreadCounts.map(u => [u.senderId, u._count.id]));

    const bookingsWithUnread = bookingsWithDerivedStatus.map(booking => ({
      ...booking,
      hasUnreadMessages: (unreadMap.get(booking.clientId) || 0) > 0,
    }));

    return { bookings: bookingsWithUnread };
  });
