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

    let isVerified = false;
    if (input.bookingId && input.lat && input.lng) {
      const booking = await db.booking.findUnique({
        where: { id: input.bookingId },
        select: { latitude: true, longitude: true },
      });

      if (booking?.latitude && booking?.longitude) {
        // Haversine distance in meters
        const R = 6371e3;
        const φ1 = (input.lat * Math.PI) / 180;
        const φ2 = (booking.latitude * Math.PI) / 180;
        const Δφ = ((booking.latitude - input.lat) * Math.PI) / 180;
        const Δλ = ((booking.longitude - input.lng) * Math.PI) / 180;

        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance <= 300) {
          // within 300 meters
          isVerified = true;
        }
      }
    }

    const timeEntry = await db.timeEntry.create({
      data: {
        userId: input.userId,
        bookingId: input.bookingId,
        lat: input.lat,
        lng: input.lng,
        locationNote: input.locationNote,
        notes: isVerified ? "Location verified (On-site)" : "Location check failed (Off-site or no data)",
        startTime: new Date(),
      },
    });

    return timeEntry;
  });
