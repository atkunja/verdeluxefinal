import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import nodemailer from "nodemailer";

export const sendTransactionalEmail = baseProcedure
  .input(
    z.object({
      to: z.string().email(),
      templateType: z.string(),
      context: z.record(z.any()).optional(),
      fallbackSubject: z.string().optional(),
      fallbackBody: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const template = await db.emailTemplate.findFirst({
      where: { type: input.templateType },
    });

    const subject = template?.subject || input.fallbackSubject || "Notification";
    let body = template?.body || input.fallbackBody || "";

    if (input.context && body) {
      // simple interpolation {{key}}
      body = body.replace(/{{(.*?)}}/g, (_, key) => {
        const trimmed = key.trim();
        const value = input.context?.[trimmed];
        return value !== undefined ? String(value) : "";
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: Number(process.env.SMTP_PORT || 1025),
      secure: false,
    });

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || "no-reply@verdeluxe.com",
        to: input.to,
        subject,
        text: body,
      });
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        console.warn("⚠️ SMTP connection refused. Logging email to console instead:");
        console.log(`[Email Mock] To: ${input.to}`);
        console.log(`[Email Mock] Subject: ${subject}`);
        console.log(`[Email Mock] Body:\n${body}`);
      } else {
        throw error;
      }
    }

    // Log if template and recipient match a known user
    if (template) {
      const recipient = await db.user.findFirst({ where: { email: input.to }, select: { id: true } });
      if (recipient) {
        await db.emailLog.create({
          data: {
            recipientId: recipient.id,
            templateId: template.id,
            sentAt: new Date(),
            status: "sent",
          },
        });
      }
    }

    return { success: true };
  });
