import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const updateTimeEntry = baseProcedure
  .input(
    z.object({
      id: z.number(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { id, ...data } = input;
    const timeEntry = await db.timeEntry.update({
      where: { id },
      data,
    });

    return timeEntry;
  });
