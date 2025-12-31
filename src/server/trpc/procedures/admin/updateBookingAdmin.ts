import { z } from "zod";
import { db } from "~/server/db";
import { env } from "~/server/env";
import nodemailer from "nodemailer";
import { requireAdmin } from "~/server/trpc/main";
import { stripe } from "~/server/stripe/client";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

export const updateBookingAdmin = requireAdmin
  .input(
    z.object({
      bookingId: z.number(),
      cleanerId: z.number().nullable().optional(),
      cleanerIds: z.array(z.number()).optional(),
      serviceType: z.string().optional(),
      scheduledDate: z.string().datetime().optional(),
      scheduledTime: z.string().optional(),
      durationHours: z.number().nonnegative().optional(),
      address: z.string().optional(),
      addressLine1: z.string().optional(),
      addressLine2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      placeId: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      specialInstructions: z.string().nullable().optional(),
      privateBookingNote: z.string().nullable().optional(),
      privateCustomerNote: z.string().nullable().optional(),
      providerNote: z.string().nullable().optional(),
      finalPrice: z.number().nonnegative().nullable().optional(),
      status: z
        .enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
        .optional(),
      scope: z.enum(["single", "series"]).optional(),
      cancellationFeeApplied: z.boolean().optional(),
      cancellationFeeAmount: z.number().optional(),
      notifyEmail: z.boolean().optional(),
      notifySms: z.boolean().optional(),
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
    })
  )
  .mutation(async ({ input }) => {
    const existingBooking = await db.booking.findUnique({
      where: { id: input.bookingId },
      include: { client: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, stripeCustomerId: true } } }
    });

    if (!existingBooking) {
      throw new Error("Booking not found");
    }

    if (input.cleanerId !== undefined && input.cleanerId !== null) {
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

    // Handle Manual Card Token Exchange
    let paymentDetailsFinal = input.paymentDetails;
    if (
      input.paymentMethod === "CREDIT_CARD" &&
      input.paymentDetails?.startsWith("tok_") &&
      stripe
    ) {
      try {
        const client = existingBooking.client;
        if (!client) throw new Error("Booking has no client attached");

        let stripeCustomerId = client.stripeCustomerId;
        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: client.email ?? undefined,
            name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
            phone: client.phone ?? undefined,
            metadata: { userId: String(client.id) },
          });
          stripeCustomerId = customer.id;
          await db.user.update({
            where: { id: client.id },
            data: { stripeCustomerId },
          });
        }

        const paymentMethod = await stripe.paymentMethods.create({
          type: 'card',
          card: { token: input.paymentDetails },
        });

        await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: stripeCustomerId,
        });

        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: { default_payment_method: paymentMethod.id },
        });

        paymentDetailsFinal = paymentMethod.id;

      } catch (err) {
        console.error("Failed to process manual card token in update:", err);
        throw new Error(`Failed to save credit card: ${(err as any).message}`);
      }
    }

    const updateData: any = {};
    const primaryCleanerId =
      (input.cleanerIds && input.cleanerIds[0]) ?? (input.cleanerId !== undefined ? input.cleanerId : undefined);
    if (primaryCleanerId !== undefined) updateData.cleanerId = primaryCleanerId;
    if (input.serviceType !== undefined) updateData.serviceType = input.serviceType;
    if (input.scheduledDate !== undefined)
      updateData.scheduledDate = new Date(input.scheduledDate);
    if (input.scheduledTime !== undefined) updateData.scheduledTime = input.scheduledTime;
    if (input.durationHours !== undefined) updateData.durationHours = input.durationHours;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.addressLine1 !== undefined) updateData.addressLine1 = input.addressLine1;
    if (input.addressLine2 !== undefined) updateData.addressLine2 = input.addressLine2;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.state !== undefined) updateData.state = input.state;
    if (input.postalCode !== undefined) updateData.postalCode = input.postalCode;
    if (input.placeId !== undefined) updateData.placeId = input.placeId;
    if (input.latitude !== undefined) updateData.latitude = input.latitude;
    if (input.longitude !== undefined) updateData.longitude = input.longitude;
    if (input.specialInstructions !== undefined)
      updateData.specialInstructions = input.specialInstructions;
    if (input.privateBookingNote !== undefined) updateData.privateBookingNote = input.privateBookingNote;
    if (input.privateCustomerNote !== undefined) updateData.privateCustomerNote = input.privateCustomerNote;
    if (input.providerNote !== undefined) updateData.providerNote = input.providerNote;
    if (input.finalPrice !== undefined) updateData.finalPrice = input.finalPrice;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.cancellationFeeApplied !== undefined) updateData.cancellationFeeApplied = input.cancellationFeeApplied;
    if (input.serviceFrequency !== undefined)
      updateData.serviceFrequency = input.serviceFrequency;
    if (input.houseSquareFootage !== undefined)
      updateData.houseSquareFootage = input.houseSquareFootage;
    if (input.basementSquareFootage !== undefined)
      updateData.basementSquareFootage = input.basementSquareFootage;
    if (input.numberOfBedrooms !== undefined)
      updateData.numberOfBedrooms = input.numberOfBedrooms;
    if (input.numberOfBathrooms !== undefined)
      updateData.numberOfBathrooms = input.numberOfBathrooms;
    if (input.numberOfCleanersRequested !== undefined)
      updateData.numberOfCleanersRequested = input.numberOfCleanersRequested;
    if (input.cleanerPaymentAmount !== undefined)
      updateData.cleanerPaymentAmount = input.cleanerPaymentAmount;
    if (input.paymentMethod !== undefined) updateData.paymentMethod = input.paymentMethod;
    if (input.paymentDetails !== undefined) updateData.paymentDetails = paymentDetailsFinal;
    if (input.selectedExtras !== undefined)
      updateData.selectedExtras = input.selectedExtras;
    if (input.scope === "series" && existingBooking.serviceFrequency && existingBooking.serviceFrequency !== "ONE_TIME" && !existingBooking.recurrenceId) {
      updateData.recurrenceId = crypto.randomUUID();
      updateData.occurrenceNumber = existingBooking.occurrenceNumber ?? 1;
    }

    // Basic conflict guard: same cleaner and date/time as another booking
    const newDate = updateData.scheduledDate ? new Date(updateData.scheduledDate) : existingBooking.scheduledDate;
    const newTime = updateData.scheduledTime ?? existingBooking.scheduledTime;
    const cleanerIdsToCheck =
      input.cleanerIds && input.cleanerIds.length > 0
        ? Array.from(new Set(input.cleanerIds))
        : primaryCleanerId
          ? [primaryCleanerId]
          : [];
    if (!input.overrideConflict && cleanerIdsToCheck.length > 0 && (updateData.scheduledDate || updateData.scheduledTime)) {
      const conflict = await db.booking.findFirst({
        where: {
          id: { not: input.bookingId },
          scheduledDate: newDate,
          scheduledTime: newTime,
          OR: [
            { cleanerId: { in: cleanerIdsToCheck } },
            { cleaners: { some: { cleanerId: { in: cleanerIdsToCheck } } } },
          ],
        },
        select: { id: true },
      });
      if (conflict) {
        throw new Error("Conflict: cleaner already booked at that time");
      }

      // time-off / availability
      const timeOff = await db.timeOffRequest.findFirst({
        where: {
          cleanerId: { in: cleanerIdsToCheck },
          status: "APPROVED",
          startDate: { lte: newDate },
          endDate: { gte: newDate },
        },
        select: { id: true },
      });
      if (timeOff) {
        throw new Error("Conflict: cleaner is on approved time off");
      }
    }

    let booking;
    const prevFinalPrice = existingBooking.finalPrice;
    if (input.scope === "series") {
      // Update series by recurrenceId if available
      const current = await db.booking.findUnique({ where: { id: input.bookingId }, select: { recurrenceId: true, scheduledDate: true } });
      if (current?.recurrenceId) {
        const series = await db.booking.findMany({
          where: {
            recurrenceId: current.recurrenceId,
            scheduledDate: { gte: current.scheduledDate } // Only update this and future ones
          }
        });

        // Calculate date shift if scheduledDate is changing
        let dateDeltaMs = 0;
        if (updateData.scheduledDate) {
          dateDeltaMs = new Date(updateData.scheduledDate).getTime() - new Date(current.scheduledDate).getTime();
        }

        for (const b of series) {
          const targetDate = updateData.scheduledDate
            ? new Date(new Date(b.scheduledDate).getTime() + dateDeltaMs)
            : b.scheduledDate;

          const targetTime = updateData.scheduledTime ?? b.scheduledTime;

          if (!input.overrideConflict && cleanerIdsToCheck.length > 0 && (updateData.scheduledDate || updateData.scheduledTime)) {
            const conflict = await db.booking.findFirst({
              where: {
                id: { not: b.id },
                scheduledDate: targetDate,
                scheduledTime: targetTime,
                OR: [
                  { cleanerId: { in: cleanerIdsToCheck } },
                  { cleaners: { some: { cleanerId: { in: cleanerIdsToCheck } } } },
                ],
              },
              select: { id: true },
            });
            if (conflict) {
              throw new Error(`Conflict in series update for ${targetDate.toLocaleDateString()}: cleaner already booked`);
            }
            const timeOffConflict = await db.timeOffRequest.findFirst({
              where: {
                cleanerId: { in: cleanerIdsToCheck },
                status: "APPROVED",
                startDate: { lte: targetDate },
                endDate: { gte: targetDate },
              },
              select: { id: true },
            });
            if (timeOffConflict) {
              throw new Error(`Conflict in series update for ${targetDate.toLocaleDateString()}: cleaner time off`);
            }
          }
          await db.booking.update({
            where: { id: b.id },
            data: {
              ...updateData,
              scheduledDate: targetDate,
              recurrenceId: current.recurrenceId,
            },
          });
        }
        booking = await db.booking.findUnique({
          where: { id: input.bookingId },
          include: {
            client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            cleaner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        });
      } else {
        booking = await db.booking.update({
          where: { id: input.bookingId },
          data: updateData,
          include: {
            client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            cleaner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        });
      }
    } else {
      booking = await db.booking.update({
        where: { id: input.bookingId },
        data: updateData,
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
    }

    // Log override usage for audit visibility
    if (input.overrideConflict) {
      await db.systemLog.create({
        data: {
          user: existingBooking.clientId ? { connect: { id: existingBooking.clientId } } : undefined,
          action: "booking.override_conflict",
          entity: "booking",
          entityId: booking?.id ?? input.bookingId,
          after: {
            current: booking,
            previous: existingBooking,
            override: {
              cleanerIds: cleanerIdsToCheck,
              scheduledDate: updateData.scheduledDate ?? existingBooking.scheduledDate,
              scheduledTime: updateData.scheduledTime ?? existingBooking.scheduledTime,
            }
          },
          before: existingBooking as any,
        },
      });
    }

    // If price changed and a hold exists, adjust the hold amount
    if (
      input.finalPrice !== undefined &&
      prevFinalPrice !== undefined &&
      input.finalPrice !== prevFinalPrice
    ) {
      const hold = await db.stripePayment.findFirst({
        where: {
          bookingId: input.bookingId,
          status: { in: ["requires_capture", "requires_confirmation"] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (hold?.stripeIntentId) {
        try {
          await stripe.paymentIntents.update(hold.stripeIntentId, {
            amount: Math.round((input.finalPrice ?? 0) * 100),
            description: hold.description ?? `Hold for booking #${input.bookingId}`,
          });
          await db.stripePayment.update({
            where: { id: hold.id },
            data: { amount: input.finalPrice ?? 0 },
          });
        } catch (err) {
          // keep going; hold adjustment best-effort
          console.error("Failed to update hold amount", err);
        }
      }
    }

    if (input.cleanerIds) {
      await db.bookingCleaner.deleteMany({ where: { bookingId: input.bookingId } });
      const ids = Array.from(new Set(input.cleanerIds));
      if (ids.length > 0) {
        await db.bookingCleaner.createMany({
          data: ids.map((cid) => ({ bookingId: input.bookingId, cleanerId: cid })),
          skipDuplicates: true,
        });
      }
    }

    // Price change adjustment: record delta for accounting; adjust Stripe if possible
    if (input.finalPrice !== undefined && input.finalPrice !== null && prevFinalPrice !== null && prevFinalPrice !== input.finalPrice && booking) {
      const delta = input.finalPrice - prevFinalPrice;
      await db.accountingEntry.create({
        data: {
          date: new Date(),
          description: `Price adjustment for booking #${booking.id}`,
          amount: delta,
          category: delta >= 0 ? "INCOME" : "EXPENSE",
          relatedBookingId: booking.id,
        },
      });

      // Try to locate a Stripe payment intent for this booking (latest hold or charge)
      const stripePayment = await db.stripePayment.findFirst({
        where: { bookingId: booking.id },
        orderBy: { createdAt: "desc" },
      });

      if (stripePayment?.stripeIntentId) {
        try {
          if (delta < 0 && stripePayment.status === "succeeded") {
            // Refund the difference for captured charges
            const refund = await stripe.refunds.create({
              payment_intent: stripePayment.stripeIntentId,
              amount: Math.abs(Math.round(delta * 100)),
            }, {
              idempotencyKey: `booking-${booking.id}-adjust-refund-${Math.round(delta * 100)}`,
            });
            await db.stripePayment.create({
              data: {
                bookingId: booking.id,
                stripeIntentId: refund.id,
                amount: delta, // negative
                status: refund.status,
                currency: stripePayment.currency ?? "usd",
                description: "Price decrease refund",
              },
            });
          } else if (delta < 0 && stripePayment.status !== "succeeded") {
            // Hold: adjust down before capture
            await stripe.paymentIntents.update(stripePayment.stripeIntentId, {
              amount: Math.max(50, Math.round((input.finalPrice ?? 0) * 100)),
            });
            await db.stripePayment.update({
              where: { id: stripePayment.id },
              data: { amount: input.finalPrice ?? 0, description: "Adjusted hold after price decrease" },
            });
          } else if (delta > 0 && stripePayment.status !== "succeeded") {
            // Hold: try to increase, else recreate a new intent
            try {
              await stripe.paymentIntents.update(stripePayment.stripeIntentId, {
                amount: Math.round((input.finalPrice ?? 0) * 100),
              });
              await db.stripePayment.update({
                where: { id: stripePayment.id },
                data: { amount: input.finalPrice ?? 0, description: "Adjusted hold after price increase" },
              });
            } catch (err) {
              const newIntent = await stripe.paymentIntents.create({
                amount: Math.round((input.finalPrice ?? 0) * 100),
                currency: stripePayment.currency ?? "usd",
                description: `Recreated hold for booking #${booking.id}`,
                metadata: { bookingId: booking.id.toString() },
                capture_method: "manual",
              });
              await db.stripePayment.create({
                data: {
                  bookingId: booking.id,
                  stripeIntentId: newIntent.id,
                  amount: input.finalPrice ?? 0,
                  status: newIntent.status,
                  currency: newIntent.currency,
                  description: newIntent.description ?? undefined,
                },
              });
            }
          } else if (delta > 0 && stripePayment.status === "succeeded") {
            // Captured: charge the delta
            const intent = await stripe.paymentIntents.create({
              amount: Math.round(delta * 100),
              currency: stripePayment.currency ?? "usd",
              description: `Price increase for booking #${booking.id}`,
              metadata: { bookingId: booking.id.toString() },
            }, {
              idempotencyKey: `booking-${booking.id}-adjust-charge-${Math.round(delta * 100)}`,
            });
            await db.stripePayment.create({
              data: {
                bookingId: booking.id,
                stripeIntentId: intent.id,
                amount: delta,
                status: intent.status,
                currency: intent.currency,
                description: intent.description ?? undefined,
              },
            });
          }
        } catch (err) {
          console.error("Stripe adjustment failed", err);
        }
      }
    }

    if (input.status === "CANCELLED") {
      // Cancel entire series if requested and recurrenceId exists
      if (input.scope === "series" && existingBooking.recurrenceId) {
        await db.booking.updateMany({
          where: { recurrenceId: existingBooking.recurrenceId },
          data: { status: "CANCELLED" },
        });
      }

      const holdToCancel = await db.stripePayment.findFirst({
        where: {
          bookingId: input.bookingId,
          status: { in: ["requires_capture", "requires_confirmation"] },
        },
        orderBy: { createdAt: "desc" },
      });
      const latestCharge = await db.stripePayment.findFirst({
        where: { bookingId: input.bookingId, status: "succeeded" },
        orderBy: { createdAt: "desc" },
      });

      const feeAmount =
        input.cancellationFeeApplied && input.cancellationFeeAmount !== undefined
          ? input.cancellationFeeAmount
          : input.cancellationFeeApplied
            ? Math.max(
              (booking?.finalPrice ?? 0) *
              (env.CANCELLATION_FEE_PERCENT ? Number(env.CANCELLATION_FEE_PERCENT) : 20) /
              100,
              0
            )
            : 0;

      // If there's a hold, capture up to fee and release remainder
      if (holdToCancel?.stripeIntentId) {
        try {
          if (input.cancellationFeeApplied && feeAmount > 0) {
            const captureAmount = Math.min(feeAmount, holdToCancel.amount ?? feeAmount);
            await stripe.paymentIntents.capture(holdToCancel.stripeIntentId, {
              amount_to_capture: Math.round(captureAmount * 100),
            });
            await db.stripePayment.update({
              where: { id: holdToCancel.id },
              data: { status: "succeeded", amount: captureAmount },
            });
          } else {
            await stripe.paymentIntents.cancel(holdToCancel.stripeIntentId);
            await db.stripePayment.update({
              where: { id: holdToCancel.id },
              data: { status: "canceled" },
            });
          }
        } catch (err) {
          console.error("Failed to settle hold on booking cancellation", err);
        }
      } else if (latestCharge?.stripeIntentId && input.cancellationFeeApplied) {
        // Already charged: refund all but the fee
        const refundable = (latestCharge.amount ?? 0) - feeAmount;
        if (refundable > 0) {
          try {
            await stripe.refunds.create({
              payment_intent: latestCharge.stripeIntentId,
              amount: Math.round(refundable * 100),
            }, {
              idempotencyKey: `booking-${input.bookingId}-cancel-refund`,
            });
            await db.stripePayment.create({
              data: {
                bookingId: booking?.id ?? input.bookingId,
                stripeIntentId: latestCharge.stripeIntentId,
                amount: -refundable,
                status: "refunded",
                currency: latestCharge.currency ?? "usd",
                description: "Partial refund on cancellation (keeping fee)",
              },
            });
          } catch (err) {
            console.error("Failed to partially refund on cancellation", err);
          }
        }
      } else if (latestCharge?.stripeIntentId && !input.cancellationFeeApplied) {
        // Fully refund
        try {
          await stripe.refunds.create({
            payment_intent: latestCharge.stripeIntentId,
            amount: Math.round((latestCharge.amount ?? 0) * 100),
          }, {
            idempotencyKey: `booking-${input.bookingId}-cancel-refund-full`,
          });
          await db.stripePayment.create({
            data: {
              bookingId: booking?.id ?? input.bookingId,
              stripeIntentId: latestCharge.stripeIntentId,
              amount: -(latestCharge.amount ?? 0),
              status: "refunded",
              currency: latestCharge.currency ?? "usd",
              description: "Full refund on cancellation",
            },
          });
        } catch (err) {
          console.error("Failed to refund on cancellation", err);
        }
      }

      const sendSms = async (to: string, body: string) => {
        try {
          await fetch("https://api.openphone.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: env.OPENPHONE_API_KEY,
            },
            body: JSON.stringify({
              to: [to],
              from: env.OPENPHONE_PHONE_NUMBER,
              content: body,
            }),
          });
        } catch (err) {
          console.error("Failed to send SMS", err);
        }
      };

      if (input.notifyEmail && booking?.client?.email) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "localhost",
            port: Number(process.env.SMTP_PORT || 1025),
            secure: false,
          });
          // Simple template lookup
          const template = await db.emailTemplate.findFirst({
            where: { type: "booking_cancel" },
          });
          let subject = template?.subject || `Booking #${booking.id} cancelled`;
          let body =
            template?.body ||
            `Your booking #${booking.id} scheduled for ${booking.scheduledDate.toLocaleDateString()} has been cancelled.`;
          body = body.replace(/{{\s*bookingId\s*}}/g, String(booking.id));
          body = body.replace(
            /{{\s*scheduledDate\s*}}/g,
            booking.scheduledDate.toLocaleDateString()
          );
          await transporter.sendMail({
            from: process.env.SMTP_FROM || "no-reply@verdeluxe.com",
            to: booking.client.email,
            subject,
            text: body,
          });
        } catch (err) {
          console.error("Failed to send cancellation email", err);
        }
      }
      if (input.notifySms && booking?.client?.phone) {
        await sendSms(
          booking.client.phone,
          `Your booking #${booking.id} has been cancelled. Contact support if this was unexpected.`
        );
      }

      // Apply a cancellation fee entry if flagged
      if (input.cancellationFeeApplied && booking?.finalPrice) {
        await db.accountingEntry.create({
          data: {
            date: new Date(),
            description: `Cancellation fee for booking #${booking.id}`,
            amount: feeAmount,
            category: "INCOME",
            relatedBookingId: booking.id,
          },
        });
      }
    }

    const ensureFutureRecurrences = async () => {
      if (!booking || !booking.recurrenceId) return;
      if (!booking.serviceFrequency || booking.serviceFrequency === "ONE_TIME") return;
      if (booking.status === "CANCELLED") return;

      const horizonDays = 120;
      const increments: Record<string, number> = {
        WEEKLY: 7,
        BIWEEKLY: 14,
        MONTHLY: 30,
      };
      const delta = increments[booking.serviceFrequency] ?? 7;
      const baseDate = new Date(booking.scheduledDate);
      const horizonDate = new Date();
      horizonDate.setDate(horizonDate.getDate() + horizonDays);

      const cleanerLinks = await db.bookingCleaner.findMany({
        where: { bookingId: booking.id },
        select: { cleanerId: true },
      });
      const recurringCleanerIds = cleanerLinks.map((c) => c.cleanerId);

      let n = 1;
      while (true) {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + delta * n);
        if (nextDate > horizonDate) break;

        const exists = await db.booking.findFirst({
          where: { recurrenceId: booking.recurrenceId, scheduledDate: nextDate },
          select: { id: true },
        });
        if (!exists) {
          const created = await db.booking.create({
            data: {
              clientId: booking.client.id,
              cleanerId: booking.cleaner?.id ?? null,
              serviceType: booking.serviceType,
              scheduledDate: nextDate,
              scheduledTime: booking.scheduledTime,
              durationHours: booking.durationHours,
              address: booking.address,
              addressLine1: booking.addressLine1 ?? booking.address,
              addressLine2: booking.addressLine2 ?? undefined,
              city: booking.city ?? undefined,
              state: booking.state ?? undefined,
              postalCode: booking.postalCode ?? undefined,
              placeId: booking.placeId ?? undefined,
              latitude: booking.latitude ?? undefined,
              longitude: booking.longitude ?? undefined,
              specialInstructions: booking.specialInstructions ?? undefined,
              privateBookingNote: booking.privateBookingNote ?? undefined,
              privateCustomerNote: booking.privateCustomerNote ?? undefined,
              providerNote: booking.providerNote ?? undefined,
              finalPrice: booking.finalPrice ?? undefined,
              status: "PENDING",
              serviceFrequency: booking.serviceFrequency,
              houseSquareFootage: booking.houseSquareFootage ?? undefined,
              basementSquareFootage: booking.basementSquareFootage ?? undefined,
              numberOfBedrooms: booking.numberOfBedrooms ?? undefined,
              numberOfBathrooms: booking.numberOfBathrooms ?? undefined,
              numberOfCleanersRequested: booking.numberOfCleanersRequested ?? undefined,
              cleanerPaymentAmount: booking.cleanerPaymentAmount ?? undefined,
              paymentMethod: booking.paymentMethod ?? undefined,
              paymentDetails: booking.paymentDetails ?? undefined,
              selectedExtras: booking.selectedExtras ?? undefined,
              recurrenceId: booking.recurrenceId,
              occurrenceNumber: (booking.occurrenceNumber ?? 1) + n,
            },
          });

          if (recurringCleanerIds.length > 0) {
            await db.bookingCleaner.createMany({
              data: recurringCleanerIds.map((cid) => ({ bookingId: created.id, cleanerId: cid })),
              skipDuplicates: true,
            });
          }
        }
        n++;
      }
    };

    await ensureFutureRecurrences();

    return { booking };
  });
