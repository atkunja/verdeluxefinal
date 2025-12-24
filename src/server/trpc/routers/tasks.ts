import { z } from "zod";
import * as trpc from "@trpc/server";
import { createTRPCRouter, requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const tasksRouter = createTRPCRouter({
    getDailyTasks: requireAdmin
        .input(z.object({ date: z.date() }))
        .query(async ({ input }) => {
            const startOfDay = new Date(input.date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(input.date);
            endOfDay.setHours(23, 59, 59, 999);

            return await db.manualTask.findMany({
                where: {
                    date: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
                orderBy: {
                    priority: "desc",
                },
                include: {
                    assignedTo: true,
                },
            });
        }),

    createTask: requireAdmin
        .input(
            z.object({
                title: z.string().min(1),
                description: z.string().optional(),
                date: z.date(),
                priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
                assignedToId: z.number().optional(),
            })
        )
        .mutation(async ({ input }) => {
            return await db.manualTask.create({
                data: input,
            });
        }),

    updateTask: requireAdmin
        .input(
            z.object({
                id: z.number(),
                title: z.string().optional(),
                description: z.string().optional(),
                status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
                priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
                assignedToId: z.number().optional().nullable(),
            })
        )
        .mutation(async ({ input }) => {
            const { id, ...data } = input;
            return await db.manualTask.update({
                where: { id },
                data,
            });
        }),

    deleteTask: requireAdmin
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            return await db.manualTask.delete({
                where: { id: input.id },
            });
        }),
});
