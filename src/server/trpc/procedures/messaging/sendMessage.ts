import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { openPhone } from "~/server/services/openphone";
import { TRPCError } from "@trpc/server";

export const sendMessage = requireAdmin
  .input(
    z.object({
      recipientId: z.number(),
      content: z.string(),
      mediaUrls: z.array(z.string()).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const senderId = ctx.profile.id;

    // 1. Get recipient phone number
    const recipient = await db.user.findUnique({
      where: { id: input.recipientId },
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
        recipient: { connect: { id: input.recipientId } },
        content: input.content,
        mediaUrls: input.mediaUrls || [],
        externalId: externalId,
        isRead: true,
      },
    });

    return message;
  });
