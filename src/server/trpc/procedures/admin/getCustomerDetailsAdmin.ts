// @ts-nocheck
import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const getCustomerDetailsAdmin = requireAdmin
  .input(
    z.object({
      customerId: z.number(),
    })
  )
  .query(async ({ input }) => {
    const customer = await db.user.findUnique({
      where: { id: input.customerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        clientBookings: {
          include: {
            cleaner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            payments: true,
            checklist: {
              include: {
                items: true,
              },
            },
          },
        },
        cleanerBookings: {
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
            payments: true,
            checklist: {
              include: {
                items: true,
              },
            },
          },
        },
        timeEntries: true,
        timeOffRequests: true,
        payments: true,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Normalize bookings combined for callers expecting a flat list
    const allBookings = [
      ...(customer.clientBookings || []),
      ...(customer.cleanerBookings || []),
    ];

    return { customer: { ...customer, bookings: allBookings } };
  });
