import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getPayoutSummary = requireAdmin
    .input(
        z.object({
            startDate: z.string().optional(),
            endDate: z.string().optional(),
        })
    )
    .query(async ({ input }) => {
        const whereDate: any = {};
        if (input.startDate) whereDate.gte = new Date(input.startDate);
        if (input.endDate) {
            const end = new Date(input.endDate);
            end.setHours(23, 59, 59, 999);
            whereDate.lte = end;
        }

        // 1. Fetch cleaners
        const cleaners = await db.user.findMany({
            where: { role: "CLEANER" },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            },
        });

        const summaries = await Promise.all(
            cleaners.map(async (cleaner) => {
                // 2. Fetch TimeEntries for this cleaner in the date range
                const timeEntries = await db.timeEntry.findMany({
                    where: {
                        userId: cleaner.id,
                        endTime: { not: null },
                        startTime: Object.keys(whereDate).length > 0 ? whereDate : undefined,
                    },
                    include: {
                        booking: {
                            select: {
                                id: true,
                                cleanerPaymentAmount: true,
                                scheduledDate: true,
                            },
                        },
                    },
                });

                // 3. Fetch Payments (already paid)
                const payments = await db.payment.findMany({
                    where: {
                        cleanerId: cleaner.id,
                        createdAt: Object.keys(whereDate).length > 0 ? whereDate : undefined,
                    },
                });

                let totalHours = 0;
                let totalOwed = 0;

                timeEntries.forEach((entry) => {
                    if (entry.endTime && entry.booking) {
                        const durationMs = entry.endTime.getTime() - entry.startTime.getTime();
                        const durationHours = durationMs / (1000 * 60 * 60);
                        totalHours += durationHours;

                        // Assume cleanerPaymentAmount is the hourly rate
                        const hourlyRate = entry.booking.cleanerPaymentAmount || 25; // fallback
                        totalOwed += durationHours * hourlyRate;
                    }
                });

                const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                const balance = totalOwed - totalPaid;

                return {
                    cleanerId: cleaner.id,
                    name: `${cleaner.firstName} ${cleaner.lastName}`,
                    email: cleaner.email,
                    totalHours: Number(totalHours.toFixed(2)),
                    totalOwed: Number(totalOwed.toFixed(2)),
                    totalPaid: Number(totalPaid.toFixed(2)),
                    balance: Number(balance.toFixed(2)),
                    entryCount: timeEntries.length,
                    paymentCount: payments.length,
                };
            })
        );

        return { summaries };
    });
