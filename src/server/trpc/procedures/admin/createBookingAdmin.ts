import { z } from "zod";
import { db } from "~/server/db";
import { randomUUID } from "crypto";
import { requireAdmin } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";

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
      durationHours: z.number().nonnegative().optional(),
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
      finalPrice: z.number().nonnegative().optional(),
      status: z
        .enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
        .default("PENDING"),
      serviceFrequency: z
        .enum(["ONE_TIME", "WEEKLY", "BIWEEKLY", "MONTHLY"])
        .optional(),
      houseSquareFootage: z.number().int().nonnegative().optional(),
      basementSquareFootage: z.number().int().nonnegative().optional(),
      numberOfBedrooms: z.number().int().nonnegative().optional(),
      numberOfBathrooms: z.number().int().nonnegative().optional(),
      numberOfCleanersRequested: z.number().int().nonnegative().optional(),
      cleanerPaymentAmount: z.number().nonnegative().optional(),
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
    // 1. Parallel Lookups for Client, Cleaner, and Checklist Template
    const [clientData, cleanerData, teamCleaners, matchingTemplate] = await Promise.all([
      // Client lookup
      input.clientId
        ? db.user.findUnique({ where: { id: input.clientId } })
        : input.clientEmail
          ? db.user.findUnique({ where: { email: input.clientEmail } })
          : null,
      // Single cleaner lookup
      input.cleanerId ? db.user.findUnique({ where: { id: input.cleanerId } }) : null,
      // Team cleaners lookup
      input.cleanerIds && input.cleanerIds.length > 0
        ? db.user.findMany({ where: { id: { in: Array.from(new Set(input.cleanerIds)) } } })
        : [],
      // Checklist template lookup
      db.checklistTemplate.findFirst({
        where: { serviceType: input.serviceType },
        include: { items: { orderBy: { order: "asc" } } },
      }),
    ]);

    // 2. Validate Lookups
    let finalClientId: number;
    if (input.clientId) {
      if (!clientData) throw new Error("Client not found");
      finalClientId = clientData.id;
    } else if (input.clientEmail) {
      if (clientData) {
        finalClientId = clientData.id;
      } else {
        const newClient = await db.user.create({
          data: {
            email: input.clientEmail,
            password: "",
            role: "CLIENT",
            firstName: input.clientFirstName,
            lastName: input.clientLastName,
            phone: input.clientPhone,
            temporaryPassword: "set-via-supabase",
            hasResetPassword: false,
          },
        });
        finalClientId = newClient.id;
      }
    } else {
      throw new Error("Either clientId or clientEmail must be provided");
    }

    if (input.cleanerId && (!cleanerData || cleanerData.role !== "CLEANER")) {
      throw new Error("Cleaner not found");
    }

    if (input.cleanerIds && input.cleanerIds.length > 0) {
      const uniqueCleanerIds = Array.from(new Set(input.cleanerIds));
      if (teamCleaners.length !== uniqueCleanerIds.length || teamCleaners.some((c) => c.role !== "CLEANER")) {
        throw new Error("One or more cleaners invalid");
      }
    }

    const primaryCleanerId = (input.cleanerIds && input.cleanerIds[0]) ?? input.cleanerId ?? null;
    const recurrenceId = input.recurrenceId || (input.serviceFrequency && input.serviceFrequency !== "ONE_TIME" ? randomUUID() : null);

    // 2.5 Handle Stripe Token Exchange (Manual Card Entry)
    let paymentDetailsFinal = input.paymentDetails;
    if (
      input.paymentMethod === "CREDIT_CARD" &&
      input.paymentDetails?.startsWith("tok_") &&
      stripe
    ) {
      try {
        // A. Get or Create Stripe Customer
        let stripeCustomerId = clientData?.stripeCustomerId;
        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: (input.clientEmail || clientData?.email) ?? undefined,
            name: `${input.clientFirstName || clientData?.firstName || ""} ${input.clientLastName || clientData?.lastName || ""}`.trim(),
            phone: (input.clientPhone || clientData?.phone) ?? undefined,
            metadata: { userId: String(finalClientId) },
          });
          stripeCustomerId = customer.id;
          // IMPORTANT: Save this to the user immediately so we don't dup customers later
          await db.user.update({
            where: { id: finalClientId },
            data: { stripeCustomerId },
          });
        }

        // B. Create Source/PaymentMethod from Token
        // Since we are using tokens from Elements but want to use PaymentMethods API ideally
        // We can create a card PaymentMethod directly from the token.
        const paymentMethod = await stripe.paymentMethods.create({
          type: 'card',
          card: { token: input.paymentDetails },
        });

        // C. Attach to Customer
        await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: stripeCustomerId,
        });

        // D. Set as default (optional, but good for "We charge it")
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: { default_payment_method: paymentMethod.id },
        });

        paymentDetailsFinal = paymentMethod.id; // Store pm_... instead of tok_...

      } catch (err) {
        console.error("Failed to process manual card token:", err);
        // We throw here because we don't want to create a booking with a dead token that looks valid
        throw new Error(`Failed to save credit card: ${(err as any).message}`);
      }
    }

    // 3. Create the Main Booking
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
        paymentDetails: paymentDetailsFinal,
        selectedExtras: input.selectedExtras ?? undefined,
        recurrenceId,
        occurrenceNumber: input.occurrenceNumber ?? (recurrenceId ? 1 : null),
      },
    });

    // 4. Parallelize Post-Creation Tasks
    const postCreationTasks: Promise<any>[] = [];

    // Cleaner assignments
    const cleanerIdsToSet = input.cleanerIds && input.cleanerIds.length > 0
      ? Array.from(new Set(input.cleanerIds))
      : primaryCleanerId ? [primaryCleanerId] : [];

    if (cleanerIdsToSet.length > 0) {
      postCreationTasks.push(db.bookingCleaner.createMany({
        data: cleanerIdsToSet.map((cid) => ({
          bookingId: booking.id,
          cleanerId: cid,
        })),
        skipDuplicates: true,
      }));
    }

    // checklist generation
    if (matchingTemplate && matchingTemplate.items.length > 0) {
      postCreationTasks.push(db.bookingChecklist.create({
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
      }));
    }

    // lead conversion
    if (input.leadId) {
      postCreationTasks.push(db.lead.update({
        where: { id: input.leadId },
        data: { status: "CONVERTED" },
      }));
    }

    // Auto-generate future occurrences (Parallelized)
    if (recurrenceId && input.serviceFrequency && input.serviceFrequency !== "ONE_TIME") {
      const increments: Record<string, number> = { WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 30 };
      const delta = increments[input.serviceFrequency] ?? 7;
      const baseDate = new Date(input.scheduledDate);

      const futureAppointments = Array.from({ length: 6 }).map((_, idx) => {
        const n = idx + 1;
        const nextDate = new Date(baseDate);
        nextDate.setDate(nextDate.getDate() + (delta * n));

        return {
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
        };
      });

      // We use createMany for the bulk insert
      postCreationTasks.push(db.booking.createMany({
        data: futureAppointments,
        skipDuplicates: true,
      }));
    }

    await Promise.all(postCreationTasks);

    return { booking };
  });
