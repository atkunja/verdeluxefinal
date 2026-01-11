import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { openPhone } from "~/server/services/openphone";
import { TRPCError } from "@trpc/server";

export const sendMessage = requireAdmin
  .input(
    z.object({
      recipientId: z.number().optional(),
      leadId: z.number().optional(),
      content: z.string(),
      mediaUrls: z.array(z.string()).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const senderId = ctx.profile.id;

    if (!input.recipientId && !input.leadId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Must provide either recipientId or leadId",
      });
    }

    let recipientId = input.recipientId;

    // If leadId is provided, find or create the user
    if (input.leadId && !recipientId) {
      const lead = await db.lead.findUnique({
        where: { id: input.leadId },
      });

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found",
        });
      }

      // Check if user already exists
      const existingUser = await db.user.findFirst({
        where: {
          OR: [
            { phone: lead.phone },
            { email: lead.email },
          ]
        }
      });

      if (existingUser) {
        recipientId = existingUser.id;
      } else {
        // Create new contact user
        const normalizedDigits = lead.phone.replace(/\D/g, "");
        const newUser = await db.user.create({
          data: {
            firstName: lead.name.split(' ')[0] || "Lead",
            lastName: lead.name.split(' ').slice(1).join(' ') || "Contact",
            phone: lead.phone,
            email: lead.email || `${normalizedDigits}@lead.luxeclean.com`,
            password: "lead-no-login-permitted", // Placeholder
            role: "CLIENT",
            notes: `Created from Lead #${lead.id} via Messaging`,
            isPinned: false
          }
        });
        recipientId = newUser.id;
      }

      // Update lead status to CONTACTED if it's NEW
      if (lead.status === "NEW") {
        await db.lead.update({
          where: { id: lead.id },
          data: { status: "CONTACTED" }
        });
      }
    }

    // 1. Get recipient phone number
    const recipient = await db.user.findUnique({
      where: { id: recipientId },
      select: { phone: true },
    });

    if (!recipient || !recipient.phone) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Recipient not found or has no phone number",
      });
    }

    // Normalize phone number to E.164 (OpenPhone requirement)
    const formattedPhone = openPhone.normalizePhone(recipient.phone);

    // 2. Send via OpenPhone
    let externalId: string | null = null;
    try {
      const response = await openPhone.sendMessage({
        to: formattedPhone,
        content: input.content,
        mediaUrls: input.mediaUrls,
      });
      // Handle different possible response structures
      const id = (response as any)?.data?.id ?? (response as any)?.id;
      if (id) {
        externalId = String(id);
      }
    } catch (error) {
      console.error("OpenPhone Send Error:", error);
      // We don't throw here to allow saving the message locally even if OpenPhone fails (or logs it)
    }

    // 3. Save to DB
    const message = await (db.message as any).create({
      data: {
        sender: { connect: { id: senderId } },
        recipient: { connect: { id: recipientId } },
        content: input.content,
        mediaUrls: input.mediaUrls || [],
        externalId: externalId,
        isRead: true,
      },
    });

    return message;
  });
