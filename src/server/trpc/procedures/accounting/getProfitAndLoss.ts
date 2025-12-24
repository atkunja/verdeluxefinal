
import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getProfitAndLoss = requireAdmin
    .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
    }))
    .query(async ({ input }) => {
        const entries = (await db.accountingEntry.findMany({
            where: {
                date: {
                    gte: input.startDate,
                    lte: input.endDate,
                },
            },
            include: {
                expense: true,
                mercuryTransaction: true,
            } as any
        })) as any[];

        const manualExpenses = (await (db as any).expense.findMany({
            where: {
                date: {
                    gte: input.startDate,
                    lte: input.endDate,
                },
                accountingEntryId: null, // Manual ones not linked to sync
            }
        })) as any[];

        let totalIncome = 0;
        let totalExpense = 0;

        for (const entry of entries) {
            if (entry.category === "INCOME") {
                totalIncome += entry.amount;
            } else if (entry.category === "EXPENSE") {
                totalExpense += entry.amount;
            }
        }

        // Daily breakdown for charts
        const dailyData: Record<string, { income: number; expense: number }> = {};

        const processItem = (date: Date, amount: number, isIncome: boolean) => {
            const dateStr = date.toISOString().split('T')[0];
            if (!dateStr) return;
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = { income: 0, expense: 0 };
            }
            if (isIncome) dailyData[dateStr]!.income += amount;
            else dailyData[dateStr]!.expense += amount;
        };

        for (const entry of entries) {
            processItem(entry.date, entry.amount, entry.category === "INCOME");
        }

        for (const exp of manualExpenses) {
            processItem(exp.date, exp.amount, false);
            totalExpense += exp.amount;
        }

        const chartData = Object.entries(dailyData).map(([date, vals]) => ({
            date,
            income: vals.income,
            expense: vals.expense,
            profit: vals.income - vals.expense
        })).sort((a, b) => a.date.localeCompare(b.date));

        // Create a unified list for the UI table
        const unifiedEntries = [
            ...entries.map((e: any) => ({ ...e, type: 'entry' as const })),
            ...manualExpenses.map((e: any) => ({ ...e, type: 'manual' as const, expense: e }))
        ].sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

        return {
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense,
            chartData,
            entries: unifiedEntries,
            manualExpenses
        };
    });
