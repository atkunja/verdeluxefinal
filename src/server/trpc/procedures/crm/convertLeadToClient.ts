import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";
import { TRPCError } from "@trpc/server";

export const convertLeadToClient = requireAdmin
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ input }) => {
        const lead = await db.lead.findUnique({
            where: { id: input.leadId },
        });

        if (!lead) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
        }

        // 1. Check if User already exists (by email or phone)
        let client = await db.user.findFirst({
            where: {
                OR: [
                    { email: { equals: lead.email, mode: 'insensitive' } },
                    { phone: { contains: lead.phone.slice(-10) } } // Match last 10 digits
                ]
            }
        });

        if (!client) {
            // 2. Create new Client User
            const tempPassword = Math.random().toString(36).slice(-8);
            // Dynamic import to prevent startup crashes on Vercel
            const bcrypt = (await import("bcryptjs")).default;
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
            console.log(`[CRM] Created new Client User ${client.id} from Lead ${lead.id}`);
        } else {
            console.log(`[CRM] Matched existing User ${client.id} for Lead ${lead.id}`);
        }

        // 3. Update Lead Status
        await db.lead.update({
            where: { id: lead.id },
            data: { status: "CONVERTED" },
        });

        return { success: true, userId: client.id, isNewUser: !client };
    });
