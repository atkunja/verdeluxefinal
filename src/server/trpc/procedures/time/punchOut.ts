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
      include: {
        booking: {
          select: { latitude: true, longitude: true },
        },
      },
    });

    if (!activeEntry) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User is not punched in.",
      });
    }

    let isVerified = false;
    if (activeEntry.booking?.latitude && activeEntry.booking?.longitude && input.lat && input.lng) {
      const R = 6371e3;
      const φ1 = (input.lat * Math.PI) / 180;
      const φ2 = (activeEntry.booking.latitude * Math.PI) / 180;
      const Δφ = ((activeEntry.booking.latitude - input.lat) * Math.PI) / 180;
      const Δλ = ((activeEntry.booking.longitude - input.lng) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance <= 300) {
        isVerified = true;
      }
    }

    const timeEntry = await db.timeEntry.update({
      where: {
        id: activeEntry.id,
      },
      data: {
        endTime: new Date(),
        outLat: input.lat,
        outLng: input.lng,
        locationNote: input.locationNote ?? activeEntry.locationNote,
        notes: `${activeEntry.notes || ""}\nClock-out location: ${isVerified ? "Verified (On-site)" : "Check failed (Off-site)"}`.trim(),
      },
    });

    return timeEntry;
  });
