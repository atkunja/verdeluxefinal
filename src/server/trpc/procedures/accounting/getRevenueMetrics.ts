import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getRevenueMetrics = requireAdmin
    .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
        const start = input.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = input.endDate || new Date();

        // 1. Get All Bookings for range in one query
        const allBookings = await db.booking.findMany({
            where: {
                scheduledDate: {
                    gte: start,
                    lte: end,
                }
            }
        });

        const revenueBookings = allBookings.filter(b => ['COMPLETED', 'CONFIRMED'].includes(b.status));
        const pendingBookings = allBookings.filter(b => b.status === 'PENDING');

        const metrics = [
            {
                key: "billedRevenue",
                value: revenueBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0)
            },
            {
                key: "pendingPayments",
                value: pendingBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0)
            },
            {
                key: "recurringRevenue",
                value: revenueBookings.filter(b => b.serviceFrequency && b.serviceFrequency !== 'ONE_TIME').reduce((sum, b) => sum + (b.finalPrice || 0), 0)
            },
            {
                key: "monthlyRevenue",
                value: revenueBookings.filter(b => b.serviceFrequency === 'MONTHLY').reduce((sum, b) => sum + (b.finalPrice || 0), 0)
            },
            {
                key: "everyOtherWeekRevenue",
                value: revenueBookings.filter(b => b.serviceFrequency === 'BIWEEKLY').reduce((sum, b) => sum + (b.finalPrice || 0), 0)
            },
            {
                key: "weeklyRevenue",
                value: revenueBookings.filter(b => b.serviceFrequency === 'WEEKLY').reduce((sum, b) => sum + (b.finalPrice || 0), 0)
            },
            // Counts
            {
                key: "countTotal",
                value: revenueBookings.length + pendingBookings.length
            },
            {
                key: "countRecurring",
                value: allBookings.filter(b => b.serviceFrequency && b.serviceFrequency !== 'ONE_TIME').length
            },
            {
                key: "countMonthly",
                value: allBookings.filter(b => b.serviceFrequency === 'MONTHLY').length
            },
            {
                key: "countWeekly",
                value: allBookings.filter(b => b.serviceFrequency === 'WEEKLY').length
            },
            {
                key: "countBiweekly",
                value: allBookings.filter(b => b.serviceFrequency === 'BIWEEKLY').length
            },
            {
                key: "countOneTime",
                value: allBookings.filter(b => !b.serviceFrequency || b.serviceFrequency === 'ONE_TIME').length
            }
        ];

        return metrics;
    });
