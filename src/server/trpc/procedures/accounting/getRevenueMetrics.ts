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

        // 1. Get Completed and Confirmed Bookings for revenue
        const revenueBookings = await db.booking.findMany({
            where: {
                status: { in: ['COMPLETED', 'CONFIRMED'] },
                scheduledDate: {
                    gte: start,
                    lte: end,
                }
            }
        });

        // 2. Get Pending Bookings
        const pendingBookings = await db.booking.findMany({
            where: {
                status: 'PENDING',
                scheduledDate: {
                    gte: start,
                    lte: end,
                }
            }
        });

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
                value: [...revenueBookings, ...pendingBookings].filter(b => b.serviceFrequency && b.serviceFrequency !== 'ONE_TIME').length
            },
            {
                key: "countMonthly",
                value: [...revenueBookings, ...pendingBookings].filter(b => b.serviceFrequency === 'MONTHLY').length
            },
            {
                key: "countWeekly",
                value: [...revenueBookings, ...pendingBookings].filter(b => b.serviceFrequency === 'WEEKLY').length
            },
            {
                key: "countBiweekly",
                value: [...revenueBookings, ...pendingBookings].filter(b => b.serviceFrequency === 'BIWEEKLY').length
            },
            {
                key: "countOneTime",
                value: [...revenueBookings, ...pendingBookings].filter(b => !b.serviceFrequency || b.serviceFrequency === 'ONE_TIME').length
            }
        ];

        return metrics;
    });
