import { z } from "zod";
import { db } from "~/server/db";
import { randomUUID } from "crypto";
import { requireAdmin } from "~/server/trpc/main";

export const createBookingAdmin = requireAdmin
  .input(
    z.object({
      clientId: z.number().optional(),
      clientEmail: z.string().email().optional(),
      clientFirstName: z.string().optional(),
      clientLastName: z.string().optional(),
      clientPhone: z.string().optional(),
      cleanerId: z.number().nullable().optional(),
      cleanerIds: z.array(z.number()).optional(),
      recurrenceId: z.string().optional(),
      occurrenceNumber: z.number().int().optional(),
      serviceType: z.string().min(1, "Service type is required"),
      scheduledDate: z.string().datetime(),
      scheduledTime: z.string().min(1, "Time is required"),
      durationHours: z.number().positive().optional(),
      address: z.string().min(1, "Address is required"),
      addressLine1: z.string().optional(),
      addressLine2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      placeId: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      specialInstructions: z.string().optional(),
      privateBookingNote: z.string().optional(),
      privateCustomerNote: z.string().optional(),
      providerNote: z.string().optional(),
      finalPrice: z.number().positive().optional(),
      status: z
        .enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
        .default("PENDING"),
      serviceFrequency: z
        .enum(["ONE_TIME", "WEEKLY", "BIWEEKLY", "MONTHLY"])
        .optional(),
      houseSquareFootage: z.number().int().positive().optional(),
      basementSquareFootage: z.number().int().positive().optional(),
      numberOfBedrooms: z.number().int().positive().optional(),
      numberOfBathrooms: z.number().int().positive().optional(),
      numberOfCleanersRequested: z.number().int().positive().optional(),
      cleanerPaymentAmount: z.number().positive().optional(),
      paymentMethod: z
        .enum(["CREDIT_CARD", "CASH", "ZELLE", "VENMO", "OTHER"])
        .optional(),
      paymentDetails: z.string().optional(),
      selectedExtras: z.array(z.number()).optional(),
      overrideConflict: z.boolean().optional(),
      leadId: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    // Handle client: existing by id or existing by email or new by email
    let finalClientId: number;

    if (input.clientId) {
      const client = await db.user.findUnique({ where: { id: input.clientId } });
      if (!client) {
        throw new Error("Client not found");
      }
      finalClientId = client.id;
    } else if (input.clientEmail) {
      const existingUser = await db.user.findUnique({
        where: { email: input.clientEmail },
      });
      if (existingUser) {
        finalClientId = existingUser.id;
      } else {
        const newClient = await db.user.create({
          data: {
            email: input.clientEmail,
            password: "", // Supabase Auth manages password
            role: "CLIENT",
            firstName: input.clientFirstName,
            lastName: input.clientLastName,
            phone: input.clientPhone,
            temporaryPassword: "set-via-supabase", // placeholder metadata
            hasResetPassword: false,
          },
        });
        finalClientId = newClient.id;
      }
    } else {
      throw new Error("Either clientId or clientEmail must be provided");
    }

    if (input.cleanerId) {
      const cleaner = await db.user.findUnique({
        where: { id: input.cleanerId },
      });
      if (!cleaner || cleaner.role !== "CLEANER") {
        throw new Error("Cleaner not found");
      }
    }

    if (input.cleanerIds && input.cleanerIds.length > 0) {
      const uniqueCleanerIds = Array.from(new Set(input.cleanerIds));
      const cleaners = await db.user.findMany({
        where: { id: { in: uniqueCleanerIds } },
      });
      if (cleaners.length !== uniqueCleanerIds.length || cleaners.some((c) => c.role !== "CLEANER")) {
        throw new Error("One or more cleaners invalid");
      }
    }

    const primaryCleanerId = (input.cleanerIds && input.cleanerIds[0]) ?? input.cleanerId ?? null;

    const recurrenceId = input.recurrenceId || (input.serviceFrequency && input.serviceFrequency !== "ONE_TIME" ? randomUUID() : null);
    const booking = await db.booking.create({
      data: {
        clientId: finalClientId,
        cleanerId: primaryCleanerId,
        serviceType: input.serviceType,
        scheduledDate: new Date(input.scheduledDate),
        scheduledTime: input.scheduledTime,
        durationHours: input.durationHours,
        address: input.address,
        addressLine1: input.addressLine1 ?? input.address,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        placeId: input.placeId,
        latitude: input.latitude,
        longitude: input.longitude,
        specialInstructions: input.specialInstructions,
        privateBookingNote: input.privateBookingNote,
        privateCustomerNote: input.privateCustomerNote,
        providerNote: input.providerNote,
        finalPrice: input.finalPrice,
        status: input.status,
        serviceFrequency: input.serviceFrequency,
        houseSquareFootage: input.houseSquareFootage,
        basementSquareFootage: input.basementSquareFootage,
        numberOfBedrooms: input.numberOfBedrooms,
        numberOfBathrooms: input.numberOfBathrooms,
        numberOfCleanersRequested: input.numberOfCleanersRequested,
        cleanerPaymentAmount: input.cleanerPaymentAmount,
        paymentMethod: input.paymentMethod,
        paymentDetails: input.paymentDetails,
        selectedExtras: input.selectedExtras ?? undefined,
        recurrenceId,
        occurrenceNumber: input.occurrenceNumber ?? (recurrenceId ? 1 : null),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const cleanerIdsToSet = input.cleanerIds && input.cleanerIds.length > 0
      ? Array.from(new Set(input.cleanerIds))
      : primaryCleanerId
        ? [primaryCleanerId]
        : [];

    if (cleanerIdsToSet.length > 0) {
      await db.bookingCleaner.createMany({
        data: cleanerIdsToSet.map((cid) => ({
          bookingId: booking.id,
          cleanerId: cid,
        })),
        skipDuplicates: true,
      });
    }

    // Auto-generate a few future occurrences for recurring bookings
    if (recurrenceId && input.serviceFrequency && input.serviceFrequency !== "ONE_TIME") {
      const addDays = (date: Date, days: number) => {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
      };
      const increments: Record<string, number> = {
        WEEKLY: 7,
        BIWEEKLY: 14,
        MONTHLY: 30,
      };
      const delta = increments[input.serviceFrequency] ?? 7;
      const baseDate = new Date(input.scheduledDate);
      const toClone = Array.from({ length: 6 }).map((_, idx) => idx + 1); // generate 6 more occurrences
      for (const n of toClone) {
        const nextDate = addDays(baseDate, delta * n);
        const exists = await db.booking.findFirst({
          where: { recurrenceId, scheduledDate: nextDate },
          select: { id: true },
        });
        if (!exists) {
          await db.booking.create({
            data: {
              clientId: finalClientId,
              cleanerId: primaryCleanerId,
              serviceType: input.serviceType,
              scheduledDate: nextDate,
              scheduledTime: input.scheduledTime,
              durationHours: input.durationHours,
              address: input.address,
              placeId: input.placeId,
              latitude: input.latitude,
              longitude: input.longitude,
              specialInstructions: input.specialInstructions,
              finalPrice: input.finalPrice,
              status: input.status,
              serviceFrequency: input.serviceFrequency,
              houseSquareFootage: input.houseSquareFootage,
              basementSquareFootage: input.basementSquareFootage,
              numberOfBedrooms: input.numberOfBedrooms,
              numberOfBathrooms: input.numberOfBathrooms,
              numberOfCleanersRequested: input.numberOfCleanersRequested,
              cleanerPaymentAmount: input.cleanerPaymentAmount,
              paymentMethod: input.paymentMethod,
              paymentDetails: input.paymentDetails,
              selectedExtras: input.selectedExtras ?? undefined,
              recurrenceId,
              occurrenceNumber: (input.occurrenceNumber ?? 1) + n,
            },
          });
        }
      }
    }

    const matchingTemplate = await db.checklistTemplate.findFirst({
      where: { serviceType: input.serviceType },
      include: { items: { orderBy: { order: "asc" } } },
    });

    if (matchingTemplate && matchingTemplate.items.length > 0) {
      await db.bookingChecklist.create({
        data: {
          bookingId: booking.id,
          templateId: matchingTemplate.id,
          items: {
            create: matchingTemplate.items.map((item) => ({
              description: item.description,
              order: item.order,
              isCompleted: false,
            })),
          },
        },
      });
    }

    if (input.leadId) {
      await db.lead.update({
        where: { id: input.leadId },
        data: { status: "CONVERTED" },
      });
    }

    return { booking };
  });
