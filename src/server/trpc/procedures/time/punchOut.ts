import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const punchOut = baseProcedure
  .input(z.object({ userId: z.number(), lat: z.number().optional(), lng: z.number().optional(), locationNote: z.string().optional() }))
  .mutation(async ({ input }) => {
    const activeEntry = await db.timeEntry.findFirst({
      where: {
        userId: input.userId,
        endTime: null,
      },
    });

    if (!activeEntry) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User is not punched in.",
      });
    }

    const timeEntry = await db.timeEntry.update({
      where: {
        id: activeEntry.id,
      },
      data: {
        endTime: new Date(),
        lat: input.lat ?? activeEntry.lat,
        lng: input.lng ?? activeEntry.lng,
        locationNote: input.locationNote ?? activeEntry.locationNote,
      },
    });

    return timeEntry;
  });
