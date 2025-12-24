import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";
import crypto from "crypto";

export const generateRecurrences = requireAdmin
  .input(
    z.object({
      horizonDays: z.number().int().positive().max(365).default(120),
    })
  )
  .mutation(async ({ input }) => {
    const recurringBookings = await db.booking.findMany({
      where: {
        serviceFrequency: { not: "ONE_TIME" },
        status: { not: "CANCELLED" },
      },
    });

    let createdCount = 0;
    let updatedIds: number[] = [];

    for (const booking of recurringBookings) {
      const recurrenceId = booking.recurrenceId ?? crypto.randomUUID();
      if (!booking.recurrenceId) {
        await db.booking.update({
          where: { id: booking.id },
          data: { recurrenceId, occurrenceNumber: booking.occurrenceNumber ?? 1 },
        });
        updatedIds.push(booking.id);
      }

      // generate future occurrences up to horizon
      const increments: Record<string, number> = {
        WEEKLY: 7,
        BIWEEKLY: 14,
        MONTHLY: 30,
      };
      const delta = increments[booking.serviceFrequency as keyof typeof increments] ?? 7;
      const baseDate = new Date(booking.scheduledDate);
      const horizonDate = new Date();
      horizonDate.setDate(horizonDate.getDate() + input.horizonDays);

      let n = 1;
      while (true) {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + delta * n);
        if (nextDate > horizonDate) break;

        const exists = await db.booking.findFirst({
          where: { recurrenceId, scheduledDate: nextDate },
          select: { id: true },
        });
        if (!exists) {
          // basic conflict check: same client & start date/time existing booking
          const conflict = await db.booking.findFirst({
            where: {
              clientId: booking.clientId,
              scheduledDate: nextDate,
              scheduledTime: booking.scheduledTime,
            },
            select: { id: true },
          });
          const cleanerConflict =
            booking.cleanerId &&
            (await db.booking.findFirst({
              where: {
                scheduledDate: nextDate,
                scheduledTime: booking.scheduledTime,
                OR: [
                  { cleanerId: booking.cleanerId },
                  { cleaners: { some: { cleanerId: booking.cleanerId } } },
                ],
              },
              select: { id: true },
            }));
          const timeOffConflict =
            booking.cleanerId &&
            (await db.timeOffRequest.findFirst({
              where: {
                cleanerId: booking.cleanerId,
                status: "APPROVED",
                startDate: { lte: nextDate },
                endDate: { gte: nextDate },
              },
              select: { id: true },
            }));
          if (conflict) {
            n++;
            continue;
          }
          if (cleanerConflict || timeOffConflict) {
            n++;
            continue;
          }

          await db.booking.create({
            data: {
              clientId: booking.clientId,
              cleanerId: booking.cleanerId,
              serviceType: booking.serviceType,
              scheduledDate: nextDate,
              scheduledTime: booking.scheduledTime,
              durationHours: booking.durationHours,
              address: booking.address,
              specialInstructions: booking.specialInstructions,
              finalPrice: booking.finalPrice,
              status: booking.status,
              serviceFrequency: booking.serviceFrequency,
              houseSquareFootage: booking.houseSquareFootage,
              basementSquareFootage: booking.basementSquareFootage,
              numberOfBedrooms: booking.numberOfBedrooms,
              numberOfBathrooms: booking.numberOfBathrooms,
              numberOfCleanersRequested: booking.numberOfCleanersRequested,
              cleanerPaymentAmount: booking.cleanerPaymentAmount,
              paymentMethod: booking.paymentMethod,
              paymentDetails: booking.paymentDetails,
              selectedExtras: booking.selectedExtras,
              recurrenceId,
              occurrenceNumber: (booking.occurrenceNumber ?? 1) + n,
            },
          });
          createdCount++;
        }
        n++;
      }
    }

    return { created: createdCount, updated: updatedIds.length };
  });
