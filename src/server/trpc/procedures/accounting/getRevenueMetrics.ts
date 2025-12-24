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

        // 1. Get Completed Bookings and their revenue
        const completedBookings = await db.booking.findMany({
            where: {
                status: 'COMPLETED',
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
                value: completedBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0)
            },
            {
                key: "pendingPayments",
                value: pendingBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0)
            },
            {
                key: "recurringRevenue",
                value: completedBookings.filter(b => b.serviceFrequency !== 'ONE_TIME').reduce((sum, b) => sum + (b.finalPrice || 0), 0)
            },
            {
                key: "monthlyRevenue",
                value: completedBookings.filter(b => b.serviceFrequency === 'MONTHLY').reduce((sum, b) => sum + (b.finalPrice || 0), 0)
            },
            {
                key: "everyOtherWeekRevenue",
                value: completedBookings.filter(b => b.serviceFrequency === 'BIWEEKLY').reduce((sum, b) => sum + (b.finalPrice || 0), 0)
            },
            {
                key: "weeklyRevenue",
                value: completedBookings.filter(b => b.serviceFrequency === 'WEEKLY').reduce((sum, b) => sum + (b.finalPrice || 0), 0)
            }
        ];

        return metrics;
    });
