import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const punchIn = baseProcedure
  .input(z.object({ userId: z.number(), bookingId: z.number().optional(), lat: z.number().optional(), lng: z.number().optional(), locationNote: z.string().optional() }))
  .mutation(async ({ input }) => {
    const activeEntry = await db.timeEntry.findFirst({
      where: {
        userId: input.userId,
        endTime: null,
      },
    });

    if (activeEntry) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "User is already punched in.",
      });
    }

    const timeEntry = await db.timeEntry.create({
      data: {
        userId: input.userId,
        bookingId: input.bookingId,
        lat: input.lat,
        lng: input.lng,
        locationNote: input.locationNote,
        startTime: new Date(),
      },
    });

    return timeEntry;
  });
