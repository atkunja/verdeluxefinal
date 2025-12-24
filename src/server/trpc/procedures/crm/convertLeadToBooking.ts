import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

export const convertLeadToBooking = requireAdmin
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ input }) => {
        const lead = await db.lead.findUnique({
            where: { id: input.leadId },
        });

        if (!lead) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
        }

        // 1. Find or Create User
        let client = await db.user.findUnique({
            where: { email: lead.email },
        });

        if (!client) {
            const tempPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const nameParts = lead.name.split(" ");
            const firstName = nameParts[0] || "Unknown";
            const lastName = nameParts.slice(1).join(" ") || "";

            client = await db.user.create({
                data: {
                    email: lead.email,
                    firstName,
                    lastName,
                    phone: lead.phone,
                    password: hashedPassword,
                    role: "CLIENT",
                    temporaryPassword: tempPassword,
                },
            });
        }

        // 2. Create Draft Booking
        const booking = await db.booking.create({
            data: {
                clientId: client.id,
                serviceType: "Standard Cleaning", // Default
                address: "Address Pending", // Placeholder
                scheduledDate: new Date(), // Today
                scheduledTime: "09:00",
                status: "PENDING",
                finalPrice: 150, // Default base price placeholder
            },
        });

        // 3. Update Lead Status
        await db.lead.update({
            where: { id: lead.id },
            data: { status: "CONVERTED" },
        });

        return { bookingId: booking.id, clientId: client.id };
    });
